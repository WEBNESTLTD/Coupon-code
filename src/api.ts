/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * API Client Layer
 * Communicates with Google Apps Script Web App (supporting CORS fetch & JSONP)
 * Includes local mock engine for testing without external credentials
 */

import { CONFIG, isUsingMock } from './config';

export interface ApiResponse<T = any> {
  success: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  payload?: T;
  [key: string]: any;
}

export interface ClaimResult {
  couponId: string;
  token: string;
  status: 'UNUSED' | 'USED';
  alreadyCreated: boolean;
  campaignId: string;
  collegeName: string;
  discountPercentage: number;
}

export interface RedeemResult {
  code: string;
  couponId: string;
  collegeName: string;
  discountPercentage: number;
  redeemedAt: string;
  status: 'USED';
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  collegeName: string;
  discountPercentage: number;
  couponPrefix: string;
  campaignStatus: 'ACTIVE' | 'INACTIVE';
  maximumCoupons: number;
  totalGenerated: number;
  totalRedeemed: number;
  totalUnused: number;
  remaining: number;
}

// Local mock database stored in localStorage for offline testing and dev preview
class LocalMockDatabase {
  private key = 'apsara_mock_db_v1';

  private getData() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      settings: {
        campaignId: CONFIG.CAMPAIGN_ID,
        campaignName: CONFIG.CAMPAIGN_NAME,
        collegeName: CONFIG.COLLEGE_NAME,
        discountPercentage: CONFIG.DISCOUNT_PERCENTAGE,
        couponPrefix: CONFIG.COUPON_PREFIX,
        startingNumber: 1,
        maximumCoupons: CONFIG.MAX_COUPONS,
        campaignStatus: 'ACTIVE'
      },
      coupons: [] as any[]
    };
  }

  private saveData(data: any) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  claim(claimRequestId: string): ApiResponse<ClaimResult> {
    const data = this.getData();
    if (data.settings.campaignStatus !== 'ACTIVE') {
      return { success: false, code: 'CAMPAIGN_INACTIVE', message: 'This offer is currently unavailable.' };
    }

    // Check duplicate claimRequestId
    const existing = data.coupons.find((c: any) => c.claimRequestId === claimRequestId.trim());
    if (existing) {
      return {
        success: true,
        couponId: existing.couponId,
        token: existing.token,
        status: existing.status,
        alreadyCreated: true,
        campaignId: existing.campaignId,
        collegeName: data.settings.collegeName,
        discountPercentage: data.settings.discountPercentage,
        message: 'Existing coupon recovered.'
      };
    }

    if (data.coupons.length >= data.settings.maximumCoupons) {
      return { success: false, code: 'LIMIT_REACHED', message: 'This offer has reached its maximum coupon limit.' };
    }

    const nextNum = data.coupons.length + data.settings.startingNumber;
    if (nextNum > data.settings.maximumCoupons) {
      return { success: false, code: 'LIMIT_REACHED', message: 'This offer has reached its maximum coupon limit.' };
    }

    const pad = String(nextNum).padStart(3, '0');
    const couponId = `${data.settings.couponPrefix.toUpperCase()}-${pad}`;
    const token = 'mock_' + Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

    const newCoupon = {
      couponId,
      token,
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
      redeemedAt: '',
      redeemedBy: '',
      campaignId: data.settings.campaignId,
      claimRequestId: claimRequestId.trim()
    };

    data.coupons.push(newCoupon);
    this.saveData(data);

    return {
      success: true,
      couponId,
      token,
      status: 'UNUSED',
      alreadyCreated: false,
      campaignId: data.settings.campaignId,
      collegeName: data.settings.collegeName,
      discountPercentage: data.settings.discountPercentage,
      message: 'Coupon generated successfully.'
    };
  }

  redeem(token: string, staffId: string): ApiResponse<RedeemResult> {
    const data = this.getData();
    if (data.settings.campaignStatus !== 'ACTIVE') {
      return { success: false, code: 'CAMPAIGN_INACTIVE', message: 'Coupon redemption is currently unavailable.' };
    }

    const coupon = data.coupons.find((c: any) => c.token === token.trim());
    if (!coupon) {
      return { success: false, code: 'INVALID_COUPON', message: 'This coupon could not be verified.' };
    }

    if (coupon.status === 'USED') {
      return {
        success: false,
        code: 'ALREADY_USED',
        couponId: coupon.couponId,
        redeemedAt: coupon.redeemedAt,
        message: 'This coupon cannot be used again.'
      };
    }

    const redeemedAt = new Date().toISOString();
    coupon.status = 'USED';
    coupon.redeemedAt = redeemedAt;
    coupon.redeemedBy = staffId || 'Staff Counter';
    this.saveData(data);

    return {
      success: true,
      code: 'VALID',
      couponId: coupon.couponId,
      collegeName: data.settings.collegeName,
      discountPercentage: data.settings.discountPercentage,
      redeemedAt,
      status: 'USED',
      message: 'Coupon redeemed successfully.'
    };
  }

  verify(token: string): ApiResponse {
    const data = this.getData();
    const coupon = data.coupons.find((c: any) => c.token === token.trim());
    if (!coupon) {
      return { success: false, code: 'INVALID_COUPON', message: 'This coupon could not be verified.' };
    }
    return {
      success: true,
      couponId: coupon.couponId,
      status: coupon.status,
      discountPercentage: data.settings.discountPercentage,
      collegeName: data.settings.collegeName,
      campaignStatus: data.settings.campaignStatus,
      redeemedAt: coupon.redeemedAt || null
    };
  }

  stats(): ApiResponse<CampaignStats> {
    const data = this.getData();
    const totalGenerated = data.coupons.length;
    const totalRedeemed = data.coupons.filter((c: any) => c.status === 'USED').length;
    const totalUnused = totalGenerated - totalRedeemed;
    const remaining = Math.max(0, data.settings.maximumCoupons - totalGenerated);

    return {
      success: true,
      campaignId: data.settings.campaignId,
      campaignName: data.settings.campaignName,
      collegeName: data.settings.collegeName,
      discountPercentage: data.settings.discountPercentage,
      couponPrefix: data.settings.couponPrefix,
      campaignStatus: data.settings.campaignStatus,
      maximumCoupons: data.settings.maximumCoupons,
      totalGenerated,
      totalRedeemed,
      totalUnused,
      remaining
    };
  }

  search(couponId: string): ApiResponse {
    const data = this.getData();
    const coupon = data.coupons.find((c: any) => c.couponId.toUpperCase() === couponId.toUpperCase().trim());
    if (!coupon) {
      return { success: false, code: 'NOT_FOUND', message: `Coupon ${couponId} not found.` };
    }
    return {
      success: true,
      coupon: {
        couponId: coupon.couponId,
        status: coupon.status,
        createdAt: coupon.createdAt,
        redeemedAt: coupon.redeemedAt,
        redeemedBy: coupon.redeemedBy
      }
    };
  }

  recent(limit = 20): ApiResponse {
    const data = this.getData();
    const recent = [...data.coupons]
      .reverse()
      .slice(0, limit)
      .map(c => ({
        couponId: c.couponId,
        status: c.status,
        createdAt: c.createdAt,
        redeemedAt: c.redeemedAt,
        redeemedBy: c.redeemedBy
      }));
    return { success: true, recent };
  }

  setStatus(status: 'ACTIVE' | 'INACTIVE'): ApiResponse {
    const data = this.getData();
    data.settings.campaignStatus = status;
    this.saveData(data);
    return { success: true, campaignStatus: status };
  }

  adminLogin(username: string, password: string): ApiResponse {
    if (username.trim() === 'apsara_admin' && password.trim() === 'ApsaraDVHIMSR2026!') {
      return { success: true, adminToken: 'mock_admin_token_' + Date.now(), username };
    }
    return { success: false, code: 'AUTH_FAILED', message: 'Invalid admin username or password.' };
  }

  reset(): void {
    localStorage.removeItem(this.key);
  }
}

const mockDb = new LocalMockDatabase();

/**
 * Execute request using JSONP to safely bypass Google Apps Script cross-origin restrictions
 */
function requestJsonp<T>(url: string, params: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = 'apsara_cb_' + Math.random().toString(36).substring(2, 10);
    const queryParams = new URLSearchParams(params);
    queryParams.set('callback', callbackName);

    const script = document.createElement('script');
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;

    const cleanup = () => {
      delete (window as any)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out. Please check your internet connection and try again.'));
    }, 15000);

    (window as any)[callbackName] = (response: T) => {
      clearTimeout(timeout);
      cleanup();
      resolve(response);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Network error communicating with Google Apps Script.'));
    };

    script.src = fullUrl;
    document.body.appendChild(script);
  });
}

/**
 * Unified API client
 */
export const Api = {
  async claim(claimRequestId: string): Promise<ApiResponse<ClaimResult>> {
    if (isUsingMock()) {
      // Simulate network latency (250ms)
      await new Promise(r => setTimeout(r, 250));
      return mockDb.claim(claimRequestId);
    }

    try {
      return await requestJsonp<ApiResponse<ClaimResult>>(CONFIG.APPS_SCRIPT_URL, {
        action: 'claim',
        claimRequestId
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Unable to connect to the coupon server. Please try again.'
      };
    }
  },

  async redeem(token: string, staffId: string): Promise<ApiResponse<RedeemResult>> {
    if (isUsingMock()) {
      await new Promise(r => setTimeout(r, 200));
      return mockDb.redeem(token, staffId);
    }

    try {
      return await requestJsonp<ApiResponse<RedeemResult>>(CONFIG.APPS_SCRIPT_URL, {
        action: 'redeem',
        token,
        staffId
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Unable to verify coupon with server. Please try again.'
      };
    }
  },

  async verify(token: string): Promise<ApiResponse> {
    if (isUsingMock()) {
      return mockDb.verify(token);
    }

    try {
      return await requestJsonp<ApiResponse>(CONFIG.APPS_SCRIPT_URL, {
        action: 'verify',
        token
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Verification check failed.'
      };
    }
  },

  async getStats(): Promise<ApiResponse<CampaignStats>> {
    if (isUsingMock()) {
      return mockDb.stats();
    }

    try {
      return await requestJsonp<ApiResponse<CampaignStats>>(CONFIG.APPS_SCRIPT_URL, {
        action: 'stats'
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to fetch campaign stats.'
      };
    }
  },

  async search(couponId: string): Promise<ApiResponse> {
    if (isUsingMock()) {
      return mockDb.search(couponId);
    }

    try {
      return await requestJsonp<ApiResponse>(CONFIG.APPS_SCRIPT_URL, {
        action: 'search',
        couponId
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Search request failed.'
      };
    }
  },

  async getRecent(limit = 20): Promise<ApiResponse> {
    if (isUsingMock()) {
      return mockDb.recent(limit);
    }

    try {
      return await requestJsonp<ApiResponse>(CONFIG.APPS_SCRIPT_URL, {
        action: 'recent',
        limit: String(limit)
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to load recent coupons.'
      };
    }
  },

  async setCampaignStatus(status: 'ACTIVE' | 'INACTIVE'): Promise<ApiResponse> {
    if (isUsingMock()) {
      return mockDb.setStatus(status);
    }

    try {
      return await requestJsonp<ApiResponse>(CONFIG.APPS_SCRIPT_URL, {
        action: 'setstatus',
        status
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to update campaign status.'
      };
    }
  },

  async adminLogin(username: string, password: string): Promise<ApiResponse> {
    if (isUsingMock()) {
      return mockDb.adminLogin(username, password);
    }

    try {
      return await requestJsonp<ApiResponse>(CONFIG.APPS_SCRIPT_URL, {
        action: 'adminlogin',
        username,
        password
      });
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Admin authentication failed.'
      };
    }
  },

  resetMock(): void {
    mockDb.reset();
  }
};
