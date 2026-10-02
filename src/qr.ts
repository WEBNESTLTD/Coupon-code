/**
 * Browser-side QR Code Generation using 'qrcode' library
 * Generates both Data URLs and Canvases
 */
import QRCode from 'qrcode';

export interface QROptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export const QRGenerator = {
  /**
   * Generates a data URL image from any string
   */
  async toDataURL(text: string, options?: QROptions): Promise<string> {
    const opts: QRCode.QRCodeToDataURLOptions = {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#1F2937',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    };
    return QRCode.toDataURL(text, opts);
  },

  /**
   * Renders QR directly to an HTML canvas element
   */
  async renderToCanvas(canvas: HTMLCanvasElement, text: string, options?: QROptions): Promise<void> {
    const opts: QRCode.QRCodeRenderersOptions = {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#1F2937',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    };
    return QRCode.toCanvas(canvas, text, opts);
  },

  /**
   * Build the permanent poster QR URL
   */
  getPosterUrl(baseUrl: string): string {
    const clean = baseUrl.replace(/\/$/, '');
    return `${clean}/#/claim`;
  },

  /**
   * Build the redemption payload / URL for a generated coupon
   */
  getCouponRedeemUrl(baseUrl: string, token: string, couponId: string): string {
    const clean = baseUrl.replace(/\/$/, '');
    return `${clean}/#/staff?token=${encodeURIComponent(token)}&id=${encodeURIComponent(couponId)}`;
  }
};
