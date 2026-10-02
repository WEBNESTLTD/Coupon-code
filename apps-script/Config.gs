/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Configuration & Constants
 */

var CONFIG = {
  CAMPAIGN_ID: "APSARA-DVHIMSR-2026",
  CAMPAIGN_NAME: "Apsara Ice Creams × DVHIMSR Student Offer",
  COLLEGE_NAME: "DVHIMSR",
  DISCOUNT_PERCENTAGE: 15,
  COUPON_PREFIX: "DVHIMSR",
  STARTING_NUMBER: 1,
  MAXIMUM_COUPONS: 500,
  CAMPAIGN_STATUS: "ACTIVE", // ACTIVE or INACTIVE

  SHEET_COUPONS: "Coupons",
  SHEET_SETTINGS: "Settings",

  STATUS_UNUSED: "UNUSED",
  STATUS_USED: "USED",

  LOCK_TIMEOUT_MS: 30000, // 30 seconds wait for concurrency lock

  COUPONS_HEADERS: [
    "Coupon ID",
    "Token",
    "Status",
    "Created At",
    "Redeemed At",
    "Redeemed By",
    "Campaign ID",
    "Claim Request ID"
  ],

  SETTINGS_HEADERS: [
    "Setting Key",
    "Setting Value"
  ]
};
