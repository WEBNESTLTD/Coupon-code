/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Redemption Service - Atomic Redemption & Verification
 */

var RedemptionService = {
  /**
   * Atomically redeems a coupon given its secure token.
   * LockService protects against double-redemptions from simultaneous staff scans.
   *
   * @param {string} token - Secure redemption token
   * @param {string} staffId - Optional staff identifier / counter name
   * @returns {Object} Result object with redemption outcome
   */
  redeemCoupon: function(token, staffId) {
    if (!token || !Security.isValidToken(token)) {
      return Utils.error("INVALID_COUPON", "This coupon could not be verified.");
    }

    var lock = LockService.getScriptLock();
    var hasLock = false;

    try {
      hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
      if (!hasLock) {
        return Utils.error("SERVER_BUSY", "Redemption system is currently busy. Please scan again.");
      }

      var settings = SheetService.getSettings();

      // Check campaign status
      if (settings.campaignStatus !== "ACTIVE") {
        return Utils.error("CAMPAIGN_INACTIVE", "Coupon redemption is currently unavailable.");
      }

      // Find coupon row by secure token
      var coupon = SheetService.findCouponByToken(token);
      if (!coupon) {
        return Utils.error("INVALID_COUPON", "This coupon could not be verified.");
      }

      // Check current status under lock
      if (coupon.status === CONFIG.STATUS_USED) {
        return Utils.error("ALREADY_USED", "This coupon cannot be used again.", {
          couponId: coupon.couponId,
          status: CONFIG.STATUS_USED,
          redeemedAt: coupon.redeemedAt
        });
      }

      // Mark coupon as USED atomically
      var redeemedAt = Utils.nowIso();
      var redeemedBy = Security.sanitizeText(staffId || "Apsara Counter Staff");
      SheetService.markCouponAsUsed(coupon.rowNumber, redeemedAt, redeemedBy);

      return Utils.success({
        code: "VALID",
        couponId: coupon.couponId,
        collegeName: settings.collegeName,
        discountPercentage: settings.discountPercentage,
        redeemedAt: redeemedAt,
        status: CONFIG.STATUS_USED
      }, "Coupon redeemed successfully.");

    } catch (err) {
      return Utils.error("REDEMPTION_ERROR", "Error processing redemption: " + err.message);
    } finally {
      if (hasLock) {
        lock.releaseLock();
      }
    }
  },

  /**
   * Verifies coupon validity without changing its status (read-only peek)
   *
   * @param {string} token - Secure token
   * @returns {Object} Coupon status details
   */
  verifyCoupon: function(token) {
    if (!token || !Security.isValidToken(token)) {
      return Utils.error("INVALID_COUPON", "This coupon could not be verified.");
    }

    try {
      var settings = SheetService.getSettings();
      var coupon = SheetService.findCouponByToken(token);

      if (!coupon) {
        return Utils.error("INVALID_COUPON", "This coupon could not be verified.");
      }

      return Utils.success({
        couponId: coupon.couponId,
        status: coupon.status,
        discountPercentage: settings.discountPercentage,
        collegeName: settings.collegeName,
        campaignStatus: settings.campaignStatus,
        redeemedAt: coupon.redeemedAt || null
      }, "Coupon status retrieved.");

    } catch (err) {
      return Utils.error("VERIFY_ERROR", "Error verifying coupon: " + err.message);
    }
  }
};
