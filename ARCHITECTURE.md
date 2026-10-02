# System Architecture Specification

## Apsara Ice Creams × DVHIMSR Student Coupon System

This document outlines the end-to-end architecture, data flow, concurrency controls, and state transitions for the zero-cost student promotional coupon infrastructure.

---

## 1. High-Level Architectural Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          STUDENT / CLIENT                              │
│                                                                        │
│  [ Permanent Poster QR ] ──▶ [ /#/claim ] ──▶ [ "GET MY COUPON" ]      │
│                                                     │                  │
│                                         Generate claimRequestId (UUID) │
│                                                     │                  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                    HTTP GET/POST or JSONP
                                                      │
┌─────────────────────────────────────────────────────▼──────────────────┐
│                     GOOGLE APPS SCRIPT WEB APP                         │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 LockService.getScriptLock(30s)                 │   │
│   │                                                                │   │
│   │   1. Validate Campaign Status (ACTIVE)                         │   │
│   │   2. Check Idempotency Key (claimRequestId)                   │   │
│   │      └─ If exists ──▶ Return existing coupon without increment │   │
│   │   3. Check Limit (Count < 500)                                 │   │
│   │   4. Sequential Number Allocation (DVHIMSR-XXX)                 │   │
│   │   5. Generate 64-char Cryptographic Token                      │   │
│   │   6. Atomic Sheet Append / State Mutation                      │   │
│   └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┬──────────────────┘
                                                      │
                                          Atomic Read / Write
                                                      │
┌─────────────────────────────────────────────────────▼──────────────────┐
│                       GOOGLE SHEETS DATA STORE                         │
│                                                                        │
│   [ Coupons Sheet ]                                                    │
│   Coupon ID | Token | Status | Created At | Redeemed At | ...          │
│                                                                        │
│   [ Settings Sheet ]                                                   │
│   Campaign ID | College | Discount | Prefix | Max Coupons | Status     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Google Sheets Schema

### A. `Coupons` Sheet

| Column Index | Field Name | Data Type | Description |
|:---:|:---|:---|:---|
| 1 | `Coupon ID` | String | Formatted sequential ID (e.g. `DVHIMSR-001`) |
| 2 | `Token` | String | 64-character SHA-256 secure random hex token |
| 3 | `Status` | Enum | `UNUSED` or `USED` |
| 4 | `Created At` | ISO 8601 String | UTC timestamp when coupon was claimed |
| 5 | `Redeemed At` | ISO 8601 String | UTC timestamp when coupon was redeemed at shop |
| 6 | `Redeemed By` | String | Terminal / staff counter identifier |
| 7 | `Campaign ID` | String | Reference identifier (`APSARA-DVHIMSR-2026`) |
| 8 | `Claim Request ID` | UUID String | Client idempotency key for deduplication |

> **Security Note:** Column 2 (`Token`) and Column 8 (`Claim Request ID`) are strictly private and never exposed to the public admin views or student UI.

### B. `Settings` Sheet

Key-value configuration stored in two columns:

| Setting Key | Setting Value | Default | Description |
|:---|:---|:---|:---|
| `Campaign ID` | `APSARA-DVHIMSR-2026` | `APSARA-DVHIMSR-2026` | Unique campaign tag |
| `Campaign Name` | `Apsara Ice Creams × DVHIMSR Student Offer` | Text | Display name |
| `College Name` | `DVHIMSR` | `DVHIMSR` | Beneficiary institution |
| `Discount Percentage`| `15` | `15` | Percentage discount |
| `Coupon Prefix` | `DVHIMSR` | `DVHIMSR` | Sequential prefix |
| `Starting Number` | `1` | `1` | First coupon index |
| `Maximum Coupons` | `500` | `500` | Hard cap on total issued coupons |
| `Campaign Status` | `ACTIVE` | `ACTIVE` | Master switch (`ACTIVE` / `INACTIVE`) |

---

## 3. Idempotency & Repeat Claim Architecture

### The Problem
On mobile networks, users often double-tap buttons, browsers automatically retry delayed requests, or users refresh during network spikes. Without idempotency, a single student action could burn 3 or 4 sequential coupons.

Conversely, our business rule explicitly allows a student to scan the poster QR again tomorrow and intentionally get another coupon.

### The Solution: `claimRequestId` Lifecycle
1. When `/claim` loads, the client checks `sessionStorage` for an existing `claimRequestId`.
2. If absent, it generates a fresh cryptographically strong UUID (e.g. `req_9a8b7c6d-...`).
3. When the user taps **GET MY COUPON**:
   - The button is disabled and a loading state appears to prevent instantaneous double-clicks.
   - The HTTP payload includes `action=claim&claimRequestId=<UUID>`.
4. In Google Apps Script, within `LockService.getScriptLock()`:
   - Apps Script scans column 8 of `Coupons`.
   - **If found:** Return the existing coupon row. `alreadyCreated: true`. **NO sequential number is consumed.**
   - **If not found:** Increment sequential counter, generate cryptographic token, append new row to `Coupons`. Return `alreadyCreated: false`.
5. If the request times out on the client, clicking "Retry" re-submits the **exact same UUID**, recovering the newly generated coupon without creating a duplicate.
6. When the student explicitly starts a new claim (or scans the poster QR on another visit), `sessionStorage` generates a **new UUID**, producing the next sequential coupon (`DVHIMSR-002`).

---

## 4. Concurrency Protection (`LockService`)

Google Apps Script runs serverless V8 worker instances in parallel. To prevent race conditions:

```javascript
var lock = LockService.getScriptLock();
var hasLock = lock.tryLock(30000); // 30-second wait window
if (!hasLock) {
  return Utils.error("SERVER_BUSY", "Server is busy. Please retry.");
}
try {
  // 1. Check idempotency
  // 2. Compute next coupon index
  // 3. Write row & flush
} finally {
  lock.releaseLock();
}
```

This guarantees:
- No two simultaneous claims can receive the same coupon number.
- No race condition can bypass the 500-coupon hard cap.
- No two counter staff scanning the same coupon simultaneously can both redeem it. Exactly one succeeds; the other is rejected as `ALREADY_USED`.

---

## 5. Token Security & Dynamic QR Encoding

- **Poster QR**: Encodes the static URL:
  `https://your-domain.com/#/claim`
- **Coupon QR**: Encodes a dynamic verification URL:
  `https://your-domain.com/#/staff?token=<64_CHAR_HEX_TOKEN>&id=DVHIMSR-001`
- The Coupon ID (`DVHIMSR-001`) is visible to the customer and staff.
- The `Token` is a 64-character SHA-256 random digest (`Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Math.random() + ...)`).
- Anyone trying to guess sequential coupons (e.g. attempting to redeem `DVHIMSR-002` without the secret token) is immediately rejected with `INVALID_COUPON`.

---

## 6. Coupon State Machine

```text
       [ Non-Existent ]
              │
              │  claimCoupon(claimRequestId) [under ScriptLock]
              ▼
         ┌─────────┐
         │ UNUSED  │ ◄────── Retry with same claimRequestId returns this state
         └────┬────┘
              │
              │  redeemCoupon(token) [under ScriptLock]
              ▼
         ┌─────────┐
         │  USED   │
         └────┬────┘
              │
              │  Any subsequent scan of this token
              ▼
       [ REJECTED: ALREADY_USED ]
```
