# Google Sheets & Apps Script Setup Guide

This guide provides step-by-step instructions for deploying the zero-cost backend for the **Apsara Ice Creams × DVHIMSR Student Coupon System**.

---

## Prerequisites
- A standard, free Google Account (personal or Google Workspace).
- Zero paid licenses or credit cards required.

---

## Step 1: Create the Google Spreadsheet

1. Open [Google Sheets](https://sheets.new) in your web browser.
2. Name your spreadsheet:
   ```text
   Apsara Ice Creams - DVHIMSR Coupons 2026
   ```

---

## Step 2: Open the Apps Script Editor

1. In the Google Sheets menu, click **Extensions** > **Apps Script**.
2. Rename the project to `Apsara-DVHIMSR-Backend`.

---

## Step 3: Copy Apps Script Files

In the Apps Script editor, create 7 script files (`.gs`) matching the files in the `apps-script/` directory of this repository:

1. **`Config.gs`**: Copy content from [`apps-script/Config.gs`](file:///e:/MBA/apps-script/Config.gs)
2. **`Security.gs`**: Copy content from [`apps-script/Security.gs`](file:///e:/MBA/apps-script/Security.gs)
3. **`Utils.gs`**: Copy content from [`apps-script/Utils.gs`](file:///e:/MBA/apps-script/Utils.gs)
4. **`SheetService.gs`**: Copy content from [`apps-script/SheetService.gs`](file:///e:/MBA/apps-script/SheetService.gs)
5. **`CouponService.gs`**: Copy content from [`apps-script/CouponService.gs`](file:///e:/MBA/apps-script/CouponService.gs)
6. **`RedemptionService.gs`**: Copy content from [`apps-script/RedemptionService.gs`](file:///e:/MBA/apps-script/RedemptionService.gs)
7. **`Code.gs`**: Copy content from [`apps-script/Code.gs`](file:///e:/MBA/apps-script/Code.gs)

---

## Step 4: Initialize the Spreadsheet Structure

1. In the Apps Script toolbar, select the function **`initSheets`** (or run `SheetService.initSheets()` in the editor console).
2. Click **Run**.
3. When prompted, click **Review permissions** and authorize the script to access your spreadsheet.
4. Check your Google Sheet:
   - You will see two pre-configured sheets:
     - **`Settings`**: Contains Campaign ID, College Name, 15% discount, DVHIMSR prefix, 500 limit, and ACTIVE status.
     - **`Coupons`**: Contains the 8 columns with frozen headers: `Coupon ID`, `Token`, `Status`, `Created At`, `Redeemed At`, `Redeemed By`, `Campaign ID`, `Claim Request ID`.

---

## Step 5: Deploy as a Web App

1. In the top-right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon (⚙️) next to *Select type* and choose **Web app**.
3. Configure the deployment settings:
   - **Description**: `Apsara DVHIMSR Production v1.0`
   - **Execute as**: **Me (your email address)** *(Essential: this ensures all visitors write using your script permissions without logging in!)*
   - **Who has access**: **Anyone** *(Essential: allows students and staff to claim and verify coupons without Google authentication).*
4. Click **Deploy**.
5. Copy the **Web App URL** generated (it will look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 6: Connect Backend to Frontend

Open `src/config.ts` and paste your Web App URL into `CONFIG.APPS_SCRIPT_URL`:

```typescript
export const CONFIG: AppConfig = {
  ...
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
  ...
};
```

Or inject it dynamically in your HTML `<head>` on static hosts:

```html
<script>
  window.APSARA_CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
    APP_BASE_URL: 'https://your-custom-domain.com'
  };
</script>
```

---

## Step 7: Test the Web App Endpoints

You can verify your deployment directly in your browser:

1. **Check Status**:
   ```text
   https://script.google.com/macros/s/.../exec?action=status
   ```
   *Expected Response:*
   ```json
   {
     "success": true,
     "campaignId": "APSARA-DVHIMSR-2026",
     "campaignName": "Apsara Ice Creams × DVHIMSR Student Offer",
     "collegeName": "DVHIMSR",
     "discountPercentage": 15,
     "campaignStatus": "ACTIVE",
     "maximumCoupons": 500
   }
   ```

2. **Test Claim Request**:
   ```text
   https://script.google.com/macros/s/.../exec?action=claim&claimRequestId=test-setup-001
   ```
   *Expected Response:* Returns `DVHIMSR-001`.
   *Retrying the same URL:* Returns `DVHIMSR-001` with `alreadyCreated: true`.
