/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Google Sheets Service Layer
 */

var SheetService = {
  /**
   * Retrieves active or bound spreadsheet
   */
  getSpreadsheet: function() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * Initializes both sheets with correct headers and initial settings if not present
   */
  initSheets: function() {
    var ss = this.getSpreadsheet();
    if (!ss) {
      throw new Error("No active spreadsheet found. Open script from your Google Sheet or attach container.");
    }

    // Initialize Settings Sheet
    var settingsSheet = ss.getSheetByName(CONFIG.SHEET_SETTINGS);
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet(CONFIG.SHEET_SETTINGS);
      settingsSheet.getRange(1, 1, 1, 2).setValues([["Setting Key", "Setting Value"]]);
      settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#f3f4f6");

      var defaultSettings = [
        ["Campaign ID", CONFIG.CAMPAIGN_ID],
        ["Campaign Name", CONFIG.CAMPAIGN_NAME],
        ["College Name", CONFIG.COLLEGE_NAME],
        ["Discount Percentage", CONFIG.DISCOUNT_PERCENTAGE],
        ["Coupon Prefix", CONFIG.COUPON_PREFIX],
        ["Starting Number", CONFIG.STARTING_NUMBER],
        ["Maximum Coupons", CONFIG.MAXIMUM_COUPONS],
        ["Campaign Status", CONFIG.CAMPAIGN_STATUS]
      ];
      settingsSheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
      settingsSheet.autoResizeColumns(1, 2);
    }

    // Initialize Coupons Sheet
    var couponsSheet = ss.getSheetByName(CONFIG.SHEET_COUPONS);
    if (!couponsSheet) {
      couponsSheet = ss.insertSheet(CONFIG.SHEET_COUPONS);
      couponsSheet.getRange(1, 1, 1, CONFIG.COUPONS_HEADERS.length).setValues([CONFIG.COUPONS_HEADERS]);
      couponsSheet.getRange(1, 1, 1, CONFIG.COUPONS_HEADERS.length).setFontWeight("bold").setBackground("#fee2e2");
      couponsSheet.setFrozenRows(1);
      couponsSheet.autoResizeColumns(1, CONFIG.COUPONS_HEADERS.length);
    }

    return { success: true, message: "Sheets initialized successfully." };
  },

  /**
   * Reads settings as an object map
   */
  getSettings: function() {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_SETTINGS);

    var settings = {
      campaignId: CONFIG.CAMPAIGN_ID,
      campaignName: CONFIG.CAMPAIGN_NAME,
      collegeName: CONFIG.COLLEGE_NAME,
      discountPercentage: CONFIG.DISCOUNT_PERCENTAGE,
      couponPrefix: CONFIG.COUPON_PREFIX,
      startingNumber: CONFIG.STARTING_NUMBER,
      maximumCoupons: CONFIG.MAXIMUM_COUPONS,
      campaignStatus: CONFIG.CAMPAIGN_STATUS
    };

    if (!sheet) return settings;

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return settings;

    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0]).trim();
      var val = data[i][1];

      if (key === "Campaign ID") settings.campaignId = String(val);
      else if (key === "Campaign Name") settings.campaignName = String(val);
      else if (key === "College Name") settings.collegeName = String(val);
      else if (key === "Discount Percentage") settings.discountPercentage = Number(val) || 15;
      else if (key === "Coupon Prefix") settings.couponPrefix = String(val);
      else if (key === "Starting Number") settings.startingNumber = parseInt(val, 10) || 1;
      else if (key === "Maximum Coupons") settings.maximumCoupons = parseInt(val, 10) || 500;
      else if (key === "Campaign Status") settings.campaignStatus = String(val).toUpperCase().trim();
    }

    return settings;
  },

  /**
   * Updates a single setting key
   */
  updateSetting: function(key, value) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_SETTINGS);
    if (!sheet) return false;

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return false;

    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === key.trim().toLowerCase()) {
        sheet.getRange(i + 2, 2).setValue(value);
        return true;
      }
    }
    // Append if not found
    sheet.appendRow([key, value]);
    return true;
  },

  /**
   * Helper to get Coupons sheet
   */
  getCouponsSheet: function() {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_COUPONS);
    if (!sheet) {
      this.initSheets();
      sheet = ss.getSheetByName(CONFIG.SHEET_COUPONS);
    }
    return sheet;
  },

  /**
   * Finds coupon row by Claim Request ID (for duplicate claim idempotency)
   * Returns object with rowNumber and data, or null
   */
  findCouponByClaimRequestId: function(claimRequestId) {
    if (!claimRequestId) return null;
    var sheet = this.getCouponsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    // Col 8 is Claim Request ID
    var requestIds = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
    for (var i = 0; i < requestIds.length; i++) {
      if (String(requestIds[i][0]).trim() === claimRequestId.trim()) {
        var rowNum = i + 2;
        var rowValues = sheet.getRange(rowNum, 1, 1, 8).getValues()[0];
        return {
          rowNumber: rowNum,
          couponId: String(rowValues[0]),
          token: String(rowValues[1]),
          status: String(rowValues[2]),
          createdAt: String(rowValues[3]),
          redeemedAt: String(rowValues[4]),
          redeemedBy: String(rowValues[5]),
          campaignId: String(rowValues[6]),
          claimRequestId: String(rowValues[7])
        };
      }
    }
    return null;
  },

  /**
   * Finds coupon row by Token (for redemption)
   */
  findCouponByToken: function(token) {
    if (!token) return null;
    var sheet = this.getCouponsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    // Col 2 is Token
    var tokens = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < tokens.length; i++) {
      if (String(tokens[i][0]).trim() === token.trim()) {
        var rowNum = i + 2;
        var rowValues = sheet.getRange(rowNum, 1, 1, 8).getValues()[0];
        return {
          rowNumber: rowNum,
          couponId: String(rowValues[0]),
          token: String(rowValues[1]),
          status: String(rowValues[2]),
          createdAt: String(rowValues[3]),
          redeemedAt: String(rowValues[4]),
          redeemedBy: String(rowValues[5]),
          campaignId: String(rowValues[6]),
          claimRequestId: String(rowValues[7])
        };
      }
    }
    return null;
  },

  /**
   * Finds coupon row by Coupon ID (e.g. DVHIMSR-001) for search/admin inspection
   */
  findCouponById: function(couponId) {
    if (!couponId) return null;
    var sheet = this.getCouponsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;

    // Col 1 is Coupon ID
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim().toUpperCase() === couponId.trim().toUpperCase()) {
        var rowNum = i + 2;
        var rowValues = sheet.getRange(rowNum, 1, 1, 8).getValues()[0];
        return {
          rowNumber: rowNum,
          couponId: String(rowValues[0]),
          status: String(rowValues[2]),
          createdAt: String(rowValues[3]),
          redeemedAt: String(rowValues[4]),
          redeemedBy: String(rowValues[5]),
          campaignId: String(rowValues[6])
          // Token is intentionally omitted for public inspection
        };
      }
    }
    return null;
  },

  /**
   * Calculates next coupon sequence number based on existing records
   */
  getNextCouponNumber: function(prefix, startingNumber) {
    var sheet = this.getCouponsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return startingNumber || 1;

    var couponIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var maxNum = (startingNumber || 1) - 1;
    var prefixUpper = (prefix || CONFIG.COUPON_PREFIX).toUpperCase() + "-";

    for (var i = 0; i < couponIds.length; i++) {
      var idStr = String(couponIds[i][0]).trim().toUpperCase();
      if (idStr.indexOf(prefixUpper) === 0) {
        var numPart = parseInt(idStr.substring(prefixUpper.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    return maxNum + 1;
  },

  /**
   * Appends a newly allocated coupon row
   */
  appendCoupon: function(coupon) {
    var sheet = this.getCouponsSheet();
    var row = [
      coupon.couponId,
      coupon.token,
      coupon.status || CONFIG.STATUS_UNUSED,
      coupon.createdAt || Utils.nowIso(),
      coupon.redeemedAt || "",
      coupon.redeemedBy || "",
      coupon.campaignId || CONFIG.CAMPAIGN_ID,
      coupon.claimRequestId || ""
    ];
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return true;
  },

  /**
   * Atomically updates coupon status to USED
   */
  markCouponAsUsed: function(rowNumber, redeemedAt, redeemedBy) {
    var sheet = this.getCouponsSheet();
    sheet.getRange(rowNumber, 3).setValue(CONFIG.STATUS_USED);
    sheet.getRange(rowNumber, 5).setValue(redeemedAt || Utils.nowIso());
    sheet.getRange(rowNumber, 6).setValue(redeemedBy || "STAFF_SCANNER");
    SpreadsheetApp.flush();
    return true;
  },

  /**
   * Get aggregate statistics for Admin view
   */
  getStats: function() {
    var sheet = this.getCouponsSheet();
    var settings = this.getSettings();
    var lastRow = sheet.getLastRow();

    var totalGenerated = 0;
    var totalRedeemed = 0;
    var totalUnused = 0;

    if (lastRow >= 2) {
      var statuses = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
      totalGenerated = statuses.length;
      for (var i = 0; i < statuses.length; i++) {
        var st = String(statuses[i][0]).trim().toUpperCase();
        if (st === CONFIG.STATUS_USED) {
          totalRedeemed++;
        } else {
          totalUnused++;
        }
      }
    }

    var remaining = Math.max(0, settings.maximumCoupons - totalGenerated);

    return {
      campaignId: settings.campaignId,
      campaignName: settings.campaignName,
      collegeName: settings.collegeName,
      discountPercentage: settings.discountPercentage,
      couponPrefix: settings.couponPrefix,
      campaignStatus: settings.campaignStatus,
      maximumCoupons: settings.maximumCoupons,
      totalGenerated: totalGenerated,
      totalRedeemed: totalRedeemed,
      totalUnused: totalUnused,
      remaining: remaining
    };
  },

  /**
   * Returns recent coupons list for admin (tokens safely omitted)
   */
  getRecentCoupons: function(limit) {
    var sheet = this.getCouponsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    var count = Math.min(limit || 20, lastRow - 1);
    var startRow = Math.max(2, lastRow - count + 1);
    var numRows = lastRow - startRow + 1;

    var rows = sheet.getRange(startRow, 1, numRows, 8).getValues();
    var results = [];

    // Return in reverse chronological order
    for (var i = rows.length - 1; i >= 0; i--) {
      results.push({
        couponId: String(rows[i][0]),
        status: String(rows[i][2]),
        createdAt: String(rows[i][3]),
        redeemedAt: String(rows[i][4]),
        redeemedBy: String(rows[i][5]),
        campaignId: String(rows[i][6])
        // Token and claimRequestId omitted for privacy/security
      });
    }

    return results;
  }
};
