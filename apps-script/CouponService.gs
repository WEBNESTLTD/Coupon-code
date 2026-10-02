/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Coupon Service - Generation, Sequential Numbering & Idempotency
 */

var CouponService = {
  /**
   * Claims a promotional coupon.
   * Fully idempotent with ScriptLock concurrency protection.
   *
   * @param {string} claimRequestId - Unique client request ID (UUID)
   * @returns {Object} Result object with coupon details or error
   */
  claimCoupon: function(claimRequestId) {
    // 1. Validate request ID
    if (!claimRequestId || !Security.isValidClaimRequestId(claimRequestId)) {
      return Utils.error("INVALID_REQUEST_ID", "A valid claim request identifier is required.");
    }

    var lock = LockService.getScriptLock();
    var hasLock = false;

    try {
      // 2. Acquire lock to prevent race conditions during claim & sequential allocation
      hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
      if (!hasLock) {
        return Utils.error("SERVER_BUSY", "The server is currently busy processing other claims. Please tap again in a moment.");
      }

      // 3. Read current campaign settings
      var settings = SheetService.getSettings();

      // 4. Verify campaign is active
      if (settings.campaignStatus !== "ACTIVE") {
        return Utils.error("CAMPAIGN_INACTIVE", "This offer is currently unavailable.");
      }

      // 5. Idempotency Check: Did this exact claim request ID already get processed?
      // Handles: double-tap, network retry, browser retry, timeout retry, page re-submission
      var existing = SheetService.findCouponByClaimRequestId(claimRequestId);
      if (existing) {
        return Utils.success({
          couponId: existing.couponId,
          token: existing.token,
          status: existing.status,
          alreadyCreated: true,
          campaignId: existing.campaignId,
          collegeName: settings.collegeName,
          discountPercentage: settings.discountPercentage
        }, "Existing coupon recovered.");
      }

      // 6. Check campaign coupon limit (default 500)
      var nextNum = SheetService.getNextCouponNumber(settings.couponPrefix, settings.startingNumber);
      if (nextNum > settings.maximumCoupons) {
        return Utils.error("LIMIT_REACHED", "This offer has reached its maximum coupon limit.");
      }

      // 7. Format sequential coupon ID (e.g. DVHIMSR-001)
      var paddedNumber = Utils.padZero(nextNum, 3);
      var couponId = settings.couponPrefix.toUpperCase() + "-" + paddedNumber;

      // 8. Generate cryptographically strong random token
      var secureToken = Security.generateSecureToken();

      // 9. Persist coupon record atomically
      var newCoupon = {
        couponId: couponId,
        token: secureToken,
        status: CONFIG.STATUS_UNUSED,
        createdAt: Utils.nowIso(),
        redeemedAt: "",
        redeemedBy: "",
        campaignId: settings.campaignId,
        claimRequestId: claimRequestId.trim()
      };

      SheetService.appendCoupon(newCoupon);

      // 10. Return success response
      return Utils.success({
        couponId: couponId,
        token: secureToken,
        status: CONFIG.STATUS_UNUSED,
        alreadyCreated: false,
        campaignId: settings.campaignId,
        collegeName: settings.collegeName,
        discountPercentage: settings.discountPercentage
      }, "Coupon generated successfully.");

    } catch (err) {
      return Utils.error("CLAIM_PROCESSING_ERROR", "Could not complete coupon claim: " + err.message);
    } finally {
      if (hasLock) {
        lock.releaseLock();
      }
    }
  }
};
