/**
 * Storage utilities for active coupon session and local state
 */

export interface ActiveCoupon {
  couponId: string;
  token: string;
  status: 'UNUSED' | 'USED';
  campaignId: string;
  discountPercentage: number;
  collegeName: string;
  claimRequestId: string;
  claimedAt: string;
  redeemedAt?: string;
}

const STORAGE_KEYS = {
  ACTIVE_COUPON: 'apsara_active_coupon',
  CLAIM_REQUEST_ID: 'apsara_current_claim_request_id',
  STAFF_ID: 'apsara_staff_id',
  MOCK_DB: 'apsara_mock_database'
};

export const Storage = {
  getActiveCoupon(): ActiveCoupon | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_COUPON);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setActiveCoupon(coupon: ActiveCoupon): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COUPON, JSON.stringify(coupon));
    } catch (e) {
      console.warn('Could not save active coupon to localStorage', e);
    }
  },

  clearActiveCoupon(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COUPON);
    } catch {}
  },

  getClaimRequestId(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.CLAIM_REQUEST_ID);
    } catch {
      return null;
    }
  },

  setClaimRequestId(id: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CLAIM_REQUEST_ID, id);
    } catch {}
  },

  clearClaimRequestId(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CLAIM_REQUEST_ID);
    } catch {}
  },

  getStaffId(): string {
    return localStorage.getItem(STORAGE_KEYS.STAFF_ID) || 'Staff Counter 1';
  },

  setStaffId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.STAFF_ID, id);
  }
};
