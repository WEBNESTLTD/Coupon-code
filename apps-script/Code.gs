/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Main Entry Points: doGet & doPost Web App Router
 */

/**
 * Handle GET requests
 * Essential for zero-CORS JSONP calls and simple fetch endpoints
 */
function doGet(e) {
  try {
    e = e || {};
    var params = e.parameter || {};
    var action = (params.action || "").toLowerCase().trim();
    var callback = params.callback;

    // Route actions
    var responseData;

    switch (action) {
      case "claim":
        var claimRequestId = params.claimRequestId || params.id;
        responseData = CouponService.claimCoupon(claimRequestId);
        break;

      case "redeem":
        var token = params.token;
        var staffId = params.staffId;
        responseData = RedemptionService.redeemCoupon(token, staffId);
        break;

      case "verify":
        var verifyToken = params.token;
        responseData = RedemptionService.verifyCoupon(verifyToken);
        break;

      case "status":
        var settings = SheetService.getSettings();
        responseData = Utils.success({
          campaignId: settings.campaignId,
          campaignName: settings.campaignName,
          collegeName: settings.collegeName,
          discountPercentage: settings.discountPercentage,
          campaignStatus: settings.campaignStatus,
          maximumCoupons: settings.maximumCoupons
        }, "Campaign status loaded.");
        break;

      case "stats":
        // Admin stats overview (no tokens exposed)
        responseData = Utils.success(SheetService.getStats(), "Campaign statistics loaded.");
        break;

      case "search":
        var queryId = params.couponId || params.q;
        var foundCoupon = SheetService.findCouponById(queryId);
        if (foundCoupon) {
          responseData = Utils.success({ coupon: foundCoupon }, "Coupon found.");
        } else {
          responseData = Utils.error("NOT_FOUND", "Coupon not found: " + queryId);
        }
        break;

      case "recent":
        var limit = parseInt(params.limit, 10) || 20;
        var recent = SheetService.getRecentCoupons(limit);
        responseData = Utils.success({ recent: recent }, "Recent coupons loaded.");
        break;

      case "init":
        responseData = SheetService.initSheets();
        break;

      default:
        responseData = Utils.error("INVALID_ACTION", "Unrecognized action: " + action + ". Supported actions: claim, redeem, verify, status, stats, search, recent, init.");
        break;
    }

    return Utils.createResponse(responseData, callback);

  } catch (err) {
    return Utils.createResponse(Utils.error("UNHANDLED_EXCEPTION", err.message || "An unexpected error occurred."), (e && e.parameter && e.parameter.callback));
  }
}

/**
 * Handle POST requests
 * Supports both application/json body and URL-encoded form data
 */
function doPost(e) {
  try {
    e = e || {};
    var data = {};

    // Parse payload from JSON or form post
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Fallback to URL parameter parsing
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    var action = (data.action || "").toLowerCase().trim();
    var responseData;

    switch (action) {
      case "claim":
        var claimRequestId = data.claimRequestId || data.id;
        responseData = CouponService.claimCoupon(claimRequestId);
        break;

      case "redeem":
        var token = data.token;
        var staffId = data.staffId;
        responseData = RedemptionService.redeemCoupon(token, staffId);
        break;

      case "verify":
        var verifyToken = data.token;
        responseData = RedemptionService.verifyCoupon(verifyToken);
        break;

      case "setstatus":
        var newStatus = String(data.status || "").toUpperCase().trim();
        if (newStatus === "ACTIVE" || newStatus === "INACTIVE") {
          SheetService.updateSetting("Campaign Status", newStatus);
          responseData = Utils.success({ campaignStatus: newStatus }, "Campaign status updated to " + newStatus);
        } else {
          responseData = Utils.error("INVALID_STATUS", "Status must be ACTIVE or INACTIVE.");
        }
        break;

      default:
        // Pass through to GET handler
        return doGet(e);
    }

    return Utils.createResponse(responseData);

  } catch (err) {
    return Utils.createResponse(Utils.error("POST_PROCESSING_ERROR", err.message || "Error processing POST request."));
  }
}
