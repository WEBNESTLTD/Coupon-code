/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Claim Page Component
 * Handles Idempotent Coupon Claiming, Timeouts, Retries, and Concurrency
 */

import { CONFIG } from '../config';
import { Api } from '../api';
import { Storage, ActiveCoupon } from '../storage';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'req_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
}

export function renderClaim(container: HTMLElement): void {
  // Retrieve or create current session's claimRequestId
  let claimRequestId: string = Storage.getClaimRequestId() || generateUuid();
  Storage.setClaimRequestId(claimRequestId);

  const existingCoupon = Storage.getActiveCoupon();

  container.innerHTML = `
    <div class="page-container">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 2.2rem; display: inline-block;">🎉</span>
        <h1 class="title-xl" style="color: var(--color-berry-900); margin: 6px 0;">
          Claim Your Discount
        </h1>
        <p class="text-muted" style="font-size: 0.95rem;">
          Get <strong style="color: var(--color-berry-600);">${CONFIG.DISCOUNT_PERCENTAGE}% OFF</strong> on your next visit to Apsara Ice Creams!
        </p>
      </div>

      ${existingCoupon ? `
        <!-- Existing Coupon Recovery Notice -->
        <div class="card" style="background: var(--color-berry-50); border: 1px solid var(--color-berry-100); text-align: center; padding: 18px;">
          <div style="font-weight: 700; color: var(--color-berry-900); font-size: 0.95rem;">
            You have an active coupon in this browser:
          </div>
          <div style="font-weight: 800; font-family: monospace; font-size: 1.4rem; color: var(--color-berry-600); margin: 6px 0;">
            ${existingCoupon.couponId}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <a href="#/coupon" class="btn btn-primary" style="min-height: 44px; font-size: 0.9rem;">
              View My Coupon →
            </a>
            <button id="btn-force-new-session" class="btn btn-secondary" style="min-height: 44px; font-size: 0.85rem;">
              Start New Claim
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Main Claim Action Card -->
      <div class="card" style="text-align: center; padding: 28px 20px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--color-cream-bg); padding: 6px 14px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; color: var(--color-charcoal-700); margin-bottom: 16px;">
          <span>🎓</span> Verified for DVHIMSR Students
        </div>

        <h2 class="title-lg" style="font-size: 1.25rem; margin-bottom: 8px;">
          Ready to enjoy rich & natural ice cream?
        </h2>
        
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 24px;">
          Press the button below to generate your unique single-use coupon code.
        </p>

        <!-- Claim Action CTA -->
        <button id="btn-claim-coupon" class="btn btn-primary" style="font-size: 1.15rem; font-weight: 800; letter-spacing: 0.02em;">
          <span id="btn-text">GET MY COUPON 🍦</span>
        </button>

        <!-- Feedback & Status Output -->
        <div id="claim-feedback" style="margin-top: 16px; display: none;"></div>

        <div style="margin-top: 20px; font-size: 0.72rem; color: var(--color-charcoal-500); line-height: 1.4;">
          No phone number or email required.<br>
          Each coupon is valid for one-time redemption at the store counter.
        </div>
      </div>

      <!-- Offer Rules Summary -->
      <div class="card" style="padding: 18px 20px;">
        <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; color: var(--color-charcoal-900);">
          📋 Offer Details
        </div>
        <ul style="padding-left: 20px; font-size: 0.8rem; color: var(--color-charcoal-700); display: flex; flex-direction: column; gap: 6px;">
          <li>Valid exclusively for DVHIMSR College students.</li>
          <li>15% discount applied directly to your bill.</li>
          <li>Each coupon is unique and single-use only.</li>
          <li>Present the coupon QR code to staff during billing.</li>
        </ul>
      </div>
    </div>
  `;

  const claimBtn = container.querySelector('#btn-claim-coupon') as HTMLButtonElement;
  const btnText = container.querySelector('#btn-text') as HTMLElement;
  const feedback = container.querySelector('#claim-feedback') as HTMLElement;
  const forceNewBtn = container.querySelector('#btn-force-new-session') as HTMLButtonElement;

  if (forceNewBtn) {
    forceNewBtn.addEventListener('click', () => {
      // Intentional new claim session: generate new request ID and clear previous active
      claimRequestId = generateUuid();
      Storage.setClaimRequestId(claimRequestId);
      Storage.clearActiveCoupon();
      renderClaim(container);
    });
  }

  // Handle GET MY COUPON action with full idempotency & timeout recovery
  let isSubmitting = false;

  async function handleClaim() {
    if (isSubmitting) return; // Prevent double-tap / double-click
    isSubmitting = true;
    claimBtn.disabled = true;
    btnText.innerHTML = `<span class="spinner"></span> Generating Coupon...`;
    feedback.style.display = 'none';

    try {
      // Send claim request with current claimRequestId
      const res = await Api.claim(claimRequestId);

      if (res.success && res.couponId && res.token) {
        // Success (newly created or recovered existing duplicate)
        const activeCoupon: ActiveCoupon = {
          couponId: res.couponId,
          token: res.token,
          status: res.status || 'UNUSED',
          campaignId: res.campaignId || CONFIG.CAMPAIGN_ID,
          discountPercentage: res.discountPercentage || CONFIG.DISCOUNT_PERCENTAGE,
          collegeName: res.collegeName || CONFIG.COLLEGE_NAME,
          claimRequestId: claimRequestId,
          claimedAt: new Date().toISOString()
        };

        Storage.setActiveCoupon(activeCoupon);

        // Transition to coupon page
        window.location.hash = '#/coupon';
      } else {
        // Handle specific error codes
        let errorMsg = res.message || 'Could not claim coupon. Please try again.';

        if (res.code === 'LIMIT_REACHED') {
          errorMsg = `<strong>COUPON LIMIT REACHED</strong><br>This offer has reached its maximum coupon limit of ${CONFIG.MAX_COUPONS}.`;
        } else if (res.code === 'CAMPAIGN_INACTIVE') {
          errorMsg = `<strong>OFFER UNAVAILABLE</strong><br>This offer is currently unavailable. Please check back later.`;
        }

        feedback.innerHTML = `
          <div style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.4;">
            ${errorMsg}
            <div style="margin-top: 8px;">
              <button id="btn-retry-claim" class="btn btn-secondary" style="min-height: 36px; padding: 6px 14px; font-size: 0.8rem;">
                🔄 Try Again
              </button>
            </div>
          </div>
        `;
        feedback.style.display = 'block';

        const retryBtn = feedback.querySelector('#btn-retry-claim');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            // Note: Retrying retains the SAME claimRequestId as required by Section 9!
            handleClaim();
          });
        }
      }
    } catch (err: any) {
      feedback.innerHTML = `
        <div style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem;">
          <strong>Connection Timeout</strong><br>
          Network response was delayed. Your claim request ID is preserved.
          <div style="margin-top: 8px;">
            <button id="btn-retry-claim" class="btn btn-secondary" style="min-height: 36px; padding: 6px 14px; font-size: 0.8rem;">
              🔄 Retry Claim
            </button>
          </div>
        </div>
      `;
      feedback.style.display = 'block';

      const retryBtn = feedback.querySelector('#btn-retry-claim');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => handleClaim());
      }
    } finally {
      isSubmitting = false;
      claimBtn.disabled = false;
      btnText.innerHTML = `GET MY COUPON 🍦`;
    }
  }

  claimBtn.addEventListener('click', handleClaim);
}
