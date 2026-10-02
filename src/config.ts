/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Central Application Configuration
 */

export interface AppConfig {
  CAMPAIGN_ID: string;
  CAMPAIGN_NAME: string;
  COLLEGE_NAME: string;
  DISCOUNT_PERCENTAGE: number;
  COUPON_PREFIX: string;
  MAX_COUPONS: number;
  APPS_SCRIPT_URL: string;
  APP_BASE_URL: string;
  USE_LOCAL_MOCK_FALLBACK: boolean;
}

// Global window declaration for runtime configuration overrides
declare global {
  interface Window {
    APSARA_CONFIG?: Partial<AppConfig>;
  }
}

const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';

export const CONFIG: AppConfig = {
  CAMPAIGN_ID: 'APSARA-DVHIMSR-2026',
  CAMPAIGN_NAME: 'Apsara Ice Creams × DVHIMSR Student Offer',
  COLLEGE_NAME: 'DVHIMSR',
  DISCOUNT_PERCENTAGE: 15,
  COUPON_PREFIX: 'DVHIMSR',
  MAX_COUPONS: 500,
  
  // Google Apps Script Web App URL
  // Replace this with your published Google Apps Script Web App Exec URL (or pass via window.APSARA_CONFIG)
  APPS_SCRIPT_URL: (typeof window !== 'undefined' && window.APSARA_CONFIG?.APPS_SCRIPT_URL) || '',
  
  // Base public URL for the application (used for generating the permanent poster QR)
  APP_BASE_URL: (typeof window !== 'undefined' && window.APSARA_CONFIG?.APP_BASE_URL) || `${currentOrigin}${currentPath}`,
  
  // When APPS_SCRIPT_URL is empty, frontend seamlessly uses high-fidelity local mock engine for testing
  USE_LOCAL_MOCK_FALLBACK: true
};

// Allow runtime overrides if window.APSARA_CONFIG is injected
if (typeof window !== 'undefined' && window.APSARA_CONFIG) {
  Object.assign(CONFIG, window.APSARA_CONFIG);
}

export function isUsingMock(): boolean {
  return !CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.trim() === '';
}
