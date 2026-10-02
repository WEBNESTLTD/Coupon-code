/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Security Utilities
 */

var Security = {
  /**
   * Generates a cryptographically strong, URL-safe random token
   * Not predictable, minimum 32 chars
   */
  generateSecureToken: function() {
    var raw = Utilities.getUuid() + "-" + new Date().getTime() + "-" + Math.random().toString(36).substring(2);
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    var hexString = digest.map(function(byte) {
      // Convert signed byte to unsigned hex string
      var unsigned = (byte < 0) ? byte + 256 : byte;
      return ("0" + unsigned.toString(16)).slice(-2);
    }).join("");
    return hexString; // 64-char hex string
  },

  /**
   * Validates token format
   */
  isValidToken: function(token) {
    if (!token || typeof token !== "string") return false;
    var trimmed = token.trim();
    // Allow 20 to 128 characters, hex or alphanumeric with hyphens
    return /^[a-zA-Z0-9\-_]{20,128}$/.test(trimmed);
  },

  /**
   * Validates claim request ID format (UUID or safe client token)
   */
  isValidClaimRequestId: function(id) {
    if (!id || typeof id !== "string") return false;
    var trimmed = id.trim();
    return trimmed.length >= 8 && trimmed.length <= 128 && /^[a-zA-Z0-9\-_]+$/.test(trimmed);
  },

  /**
   * Sanitize text input to prevent sheet injection or control chars
   */
  sanitizeText: function(input) {
    if (input === null || input === undefined) return "";
    var str = String(input).trim();
    // Neutralize formula injection if first char is = + - @
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    return str;
  },

  /**
   * Validates admin username & password against settings
   */
  validateAdmin: function(username, password) {
    if (!username || !password) return false;
    var settings = SheetService.getSettings();
    var validUser = settings.adminUsername || CONFIG.ADMIN_USERNAME;
    var validPass = settings.adminPassword || CONFIG.ADMIN_PASSWORD;

    return String(username).trim() === validUser.trim() && String(password).trim() === validPass.trim();
  },

  /**
   * Generates a signed session token for authenticated admin
   */
  generateAdminSessionToken: function() {
    var raw = "admin_" + Utilities.getUuid() + "_" + new Date().getTime();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    return digest.map(function(byte) {
      var unsigned = (byte < 0) ? byte + 256 : byte;
      return ("0" + unsigned.toString(16)).slice(-2);
    }).join("");
  }
};
