# Apsara Ice Creams × DVHIMSR Student Coupon System

> **Production-Ready Promotional Coupon System for Apsara Ice Creams × DVHIMSR College**
> **Offer:** 15% OFF for DVHIMSR Students  
> **Infrastructure Cost:** ₹0.00 / $0.00 (Zero-cost architecture using Google Sheets, Google Apps Script Web App, and Static Web Hosting)

---

## 🍦 Overview

The **Apsara Ice Creams × DVHIMSR Student Coupon System** is a mobile-first, high-reliability web application built to distribute and verify promotional discounts seamlessly at Apsara Ice Creams counters.

### Core Business Pillars
1. **ONE Permanent Poster QR**: Exactly one permanent QR code is printed on promotional banners and posters around the campus. It never expires and is reusable forever while the campaign is active.
2. **Sequential Coupon Allocation**: Each new claim action dynamically generates the next sequential coupon number (`DVHIMSR-001`, `DVHIMSR-002`, ..., up to `DVHIMSR-500`).
3. **No Student Tracking**: Zero login, zero passwords, zero OTPs, zero phone numbers, and zero email collection. Frictionless student onboarding.
4. **Idempotent Claim Protection**: Network retries, accidental double-clicks, and page re-submissions reuse the client-generated `claimRequestId` idempotency key, returning the exact same coupon without burning extra numbers.
5. **Intentional Repeat Claims Supported**: Students who scan the permanent poster QR again can intentionally generate subsequent coupons on later visits.
6. **Atomic QR Redemption**: When staff scans a coupon at the counter, server-side locking (`LockService`) guarantees that a coupon can only be redeemed once. Double-redemption attacks are rejected.

---

## 📱 User Journeys

### 1. Student Claim Flow
```text
Permanent Poster QR (on campus / online)
               ↓
Student scans with phone camera
               ↓
Opens /#/claim
               ↓
Student taps "GET MY COUPON 🍦"
               ↓
Frontend creates unique claimRequestId (UUID)
               ↓
Google Apps Script (ScriptLock Concurrency Protection)
               ↓
Allocates sequential coupon (e.g. DVHIMSR-001)
               ↓
Displays branded coupon ticket with high-res QR Code
```

### 2. Shop Counter Redemption Flow
```text
Customer presents coupon at Apsara counter
               ↓
Staff opens /#/staff on counter phone
               ↓
Camera scans student's dynamic coupon QR
               ↓
Apps Script atomically verifies token and marks status as USED
               ↓
Screen flashes GREEN: "VALID COUPON — 15% OFF APPLIED"
(Audio chime + haptic feedback)
               ↓
Subsequent scan of same QR flashes RED: "COUPON ALREADY USED"
```

---

## 📂 System Architecture & Files

```text
├── apps-script/                 # Google Apps Script Backend
│   ├── Code.gs                  # Web App entry points (doGet & doPost)
│   ├── Config.gs                # Campaign constants & configuration
│   ├── CouponService.gs         # Sequential allocation & idempotency engine
│   ├── RedemptionService.gs     # Atomic token verification & redemption
│   ├── SheetService.gs          # Google Sheets abstraction & locking
│   ├── Security.gs              # Crypto token generation & sanitization
│   └── Utils.gs                 # JSONP / CORS response builders & helpers
│
├── src/                         # Frontend Static Web App
│   ├── main.ts                  # App bootstrapper & global shell layout
│   ├── router.ts                # Client-side router (/, /claim, /coupon, /staff, /admin)
│   ├── config.ts                # Centralized environment configuration
│   ├── api.ts                   # Backend client with JSONP & local mock fallback
│   ├── storage.ts               # Local session recovery & active coupon cache
│   ├── qr.ts                    # Dynamic QR code engine (qrcode)
│   ├── styles/main.css          # Rich ice-cream themed mobile CSS design system
│   └── pages/
│       ├── Home.ts              # Promo hero & Permanent Poster QR display
│       ├── Claim.ts             # Student coupon claiming with idempotency
│       ├── Coupon.ts            # Branded ticket display with dynamic QR
│       ├── Staff.ts             # Camera scanner & atomic redemption
│       └── Admin.ts             # Campaign metrics, coupon search & controls
│
├── tests/
│   └── coupon-system.test.js    # Concurrency, idempotency & limit test suite
│
├── dist/                        # Production build static assets
├── ARCHITECTURE.md              # Detailed technical specification
├── SETUP.md                     # Step-by-step Google Sheets & Apps Script setup
├── DEPLOYMENT.md                # Deployment to GitHub Pages, Vercel, Netlify
├── SECURITY.md                  # Cryptographic & concurrency security model
└── TESTING.md                   # Complete test report & matrix verification
```

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (concurrency, matrix & idempotency)
npm test

# 3. Start development server
npm run dev

# 4. Build production static bundle
npm run build

# 5. Preview production bundle
npm run preview
```

---

## 🛠️ Configuration

Set your deployed Google Apps Script Web App URL in `src/config.ts` or inject it globally via `window.APSARA_CONFIG`:

```javascript
window.APSARA_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  APP_BASE_URL: "https://your-domain.com",
  CAMPAIGN_ID: "APSARA-DVHIMSR-2026",
  DISCOUNT_PERCENTAGE: 15,
  MAX_COUPONS: 500
};
```

When `APPS_SCRIPT_URL` is empty, the application runs on a local mock engine for testing and previewing all flows offline.

---

## 📜 License
Internal promotional software built for Apsara Ice Creams & DVHIMSR College.
