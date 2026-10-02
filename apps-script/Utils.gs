/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Utility Functions & Output Builders
 */

var Utils = {
  /**
   * Builds standardized JSON/JSONP output for Web App responses
   * Supports JSONP if 'callback' param provided (critical for Apps Script cross-origin calls)
   */
  createResponse: function(data, callback) {
    var jsonString = JSON.stringify(data);
    var output;

    if (callback && typeof callback === "string") {
      // JSONP support - sanitize callback function name
      var safeCallback = callback.replace(/[^a-zA-Z0-9_$.]/g, "");
      output = ContentService.createTextOutput(safeCallback + "(" + jsonString + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      output = ContentService.createTextOutput(jsonString)
        .setMimeType(ContentService.MimeType.JSON);
    }

    return output;
  },

  /**
   * Standard Success response object
   */
  success: function(payload, message) {
    var res = {
      success: true,
      timestamp: new Date().toISOString()
    };
    if (message) res.message = message;
    if (payload && typeof payload === "object") {
      for (var key in payload) {
        if (payload.hasOwnProperty(key)) {
          res[key] = payload[key];
        }
      }
    }
    return res;
  },

  /**
   * Standard Error response object
   */
  error: function(code, message, extra) {
    var res = {
      success: false,
      code: code || "SERVER_ERROR",
      message: message || "An unexpected error occurred.",
      timestamp: new Date().toISOString()
    };
    if (extra && typeof extra === "object") {
      for (var key in extra) {
        if (extra.hasOwnProperty(key)) {
          res[key] = extra[key];
        }
      }
    }
    return res;
  },

  /**
   * Format ISO Date string safely
   */
  nowIso: function() {
    return new Date().toISOString();
  },

  /**
   * Format number as zero-padded coupon suffix (e.g. 1 -> "001", 42 -> "042")
   */
  padZero: function(num, size) {
    var s = String(num);
    while (s.length < (size || 3)) {
      s = "0" + s;
    }
    return s;
  }
};
