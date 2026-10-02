/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Coupon Display Page Component
 */

import { CONFIG } from '../config';
import { Storage, ActiveCoupon } from '../storage';
import { QRGenerator } from '../qr';
import { Api } from '../api';

export function renderCoupon(container: HTMLElement): void {
  const coupon = Storage.getActiveCoupon();

  if (!coupon) {
    container.innerHTML = `
      <div class="page-container" style="text-align: center; justify-content: center;">
        <div class="card" style="padding: 32px 20px;">
          <span style="font-size: 3rem; display: inline-block; margin-bottom: 12px;">🎟️</span>
          <h2 class="title-lg" style="margin-bottom: 8px;">No Active Coupon Found</h2>
          <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 24px;">
            You haven't claimed a coupon in this session yet, or your previous session expired.
          </p>
          <a href="#/claim" class="btn btn-primary">
            Claim Your 15% OFF Coupon →
          </a>
        </div>
      </div>
    `;
    return;
  }

  const redeemUrl = QRGenerator.getCouponRedeemUrl(CONFIG.APP_BASE_URL, coupon.token, coupon.couponId);
  const isUsed = coupon.status === 'USED';

  container.innerHTML = `
    <div class="page-container">
      <!-- Branded Coupon Ticket -->
      <div class="coupon-ticket" id="coupon-ticket-card">
        <!-- Brand Header -->
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--color-caramel-600); letter-spacing: 0.1em; text-transform: uppercase;">
          Exclusive College Partnership
        </div>
        <div style="font-size: 1.45rem; font-weight: 800; color: var(--color-berry-900); letter-spacing: -0.02em; margin-top: 2px;">
          APSARA ICE CREAMS
        </div>

        <div style="margin: 14px 0 8px 0;">
          <span style="font-size: 3.2rem; font-weight: 900; line-height: 1; color: var(--color-berry-600); display: block;">
            ${coupon.discountPercentage || CONFIG.DISCOUNT_PERCENTAGE}% OFF
          </span>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-charcoal-700); margin-top: 4px;">
            For ${coupon.collegeName || CONFIG.COLLEGE_NAME} College Students
          </div>
        </div>

        <!-- Distinct Coupon ID Badge -->
        <div>
          <div class="coupon-code-badge" id="display-coupon-id">
            ${coupon.couponId}
          </div>
        </div>

        <!-- Dynamic QR Code -->
        <div class="coupon-qr-container" style="position: relative;">
          <canvas id="coupon-qr-canvas"></canvas>
          ${isUsed ? `
            <div style="position: absolute; inset: 0; background: rgba(255, 255, 255, 0.92); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
              <span style="font-size: 2.2rem;">✓</span>
              <span style="font-weight: 800; color: #166534; font-size: 1rem; letter-spacing: 0.05em;">ALREADY REDEEMED</span>
              <span style="font-size: 0.75rem; color: var(--color-charcoal-500); margin-top: 4px;">
                ${coupon.redeemedAt ? new Date(coupon.redeemedAt).toLocaleTimeString() : 'Used at counter'}
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Important Instructions -->
        <div>
          <span class="one-time-notice">
            ONE TIME USE ONLY
          </span>
        </div>

        <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-charcoal-700); margin-top: 14px; line-height: 1.4;">
          Show this coupon at Apsara Ice Creams counter.<br>
          <span class="text-muted" style="font-size: 0.78rem; font-weight: normal;">Staff will scan this QR to apply 15% discount.</span>
        </div>

        <div style="margin-top: 14px;">
          <span class="status-pill ${isUsed ? 'status-used' : 'status-unused'}" id="status-pill-indicator">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isUsed ? '#9CA3AF' : '#10B981'}; display: inline-block;"></span>
            STATUS: ${isUsed ? 'USED' : 'UNUSED (READY)'}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
        <button id="btn-refresh-status" class="btn btn-secondary" style="min-height: 46px; font-size: 0.9rem;">
          🔄 Check Redemption Status
        </button>

        <button id="btn-new-claim" class="btn btn-secondary" style="min-height: 46px; font-size: 0.9rem;">
          🍦 Scan Poster Again / Get Another Coupon
        </button>
      </div>

      <div style="text-align: center; font-size: 0.72rem; color: var(--color-charcoal-500); margin-top: 16px;">
        Coupon ID: ${coupon.couponId} • Claimed on ${new Date(coupon.claimedAt).toLocaleDateString()}
      </div>
    </div>
  `;

  // Render QR Canvas
  const canvas = container.querySelector('#coupon-qr-canvas') as HTMLCanvasElement;
  if (canvas) {
    // Generate QR with redeemUrl
    QRGenerator.renderToCanvas(canvas, redeemUrl, {
      width: 210,
      margin: 1,
      color: {
        dark: isUsed ? '#9CA3AF' : '#18181B',
        light: '#FFFFFF'
      }
    });
  }

  // Handle Refresh Status check
  const refreshBtn = container.querySelector('#btn-refresh-status') as HTMLButtonElement;
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Checking server...';

      try {
        const verifyRes = await Api.verify(coupon.token);
        if (verifyRes.success && verifyRes.status) {
          if (verifyRes.status !== coupon.status) {
            const updatedCoupon: ActiveCoupon = {
              ...coupon,
              status: verifyRes.status,
              redeemedAt: verifyRes.redeemedAt || coupon.redeemedAt
            };
            Storage.setActiveCoupon(updatedCoupon);
            renderCoupon(container);
            return;
          }
        }
      } catch (err) {
        console.warn('Status verification error', err);
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Check Redemption Status';
      }
    });
  }

  // Handle Intentional Repeat Claim
  const newClaimBtn = container.querySelector('#btn-new-claim') as HTMLButtonElement;
  if (newClaimBtn) {
    newClaimBtn.addEventListener('click', () => {
      // Clear active session to intentionally allow next sequential claim
      Storage.clearActiveCoupon();
      Storage.clearClaimRequestId();
      window.location.hash = '#/claim';
    });
  }
}
