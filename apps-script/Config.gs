/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Configuration & Constants
 */

var CONFIG = {
  CAMPAIGN_ID: "APSARA-DVHIMSR-2026",
  CAMPAIGN_NAME: "Apsara Ice Creams × DVHIMSR Student Offer",
  COLLEGE_NAME: "DVHIMSR",
  DISCOUNT_PERCENTAGE: 15,
  COUPON_PREFIX: "APSARA",
  STARTING_NUMBER: 1,
  MAXIMUM_COUPONS: 500,
  CAMPAIGN_STATUS: "ACTIVE", // ACTIVE or INACTIVE

  SHEET_COUPONS: "Coupons",
  SHEET_SETTINGS: "Settings",

  STATUS_UNUSED: "UNUSED",
  STATUS_USED: "USED",

  LOCK_TIMEOUT_MS: 30000, // 30 seconds wait for concurrency lock

  // Admin Portal Credentials (can also be configured/changed directly in Settings sheet)
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "@DVHAPS",

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
