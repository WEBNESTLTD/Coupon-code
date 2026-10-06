/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Home Page Component
 */

import { CONFIG } from '../config';
import { QRGenerator } from '../qr';

export function renderHome(container: HTMLElement): void {
  const posterUrl = QRGenerator.getPosterUrl(CONFIG.APP_BASE_URL);

  container.innerHTML = `
    <div class="page-container">
      <!-- Promo Banner Card -->
      <div class="card" style="background: linear-gradient(135deg, #FFF1F2, #FFFDF9); border: 2px solid var(--color-berry-100); text-align: center; padding: 32px 20px;">
        <span style="display: inline-block; font-size: 2.2rem; margin-bottom: 8px;">🍦</span>
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--color-caramel-600); letter-spacing: 0.08em; text-transform: uppercase;">
          Exclusive College Partnership
        </div>
        <h1 class="title-xl" style="color: var(--color-berry-900); margin: 8px 0 4px 0;">
          Apsara Ice Creams
        </h1>
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-charcoal-700); margin-bottom: 16px;">
          × DVHIMSR College
        </div>

        <div style="background: linear-gradient(135deg, var(--color-berry-600), var(--color-berry-700)); color: #fff; padding: 18px 20px; border-radius: var(--radius-lg); box-shadow: 0 8px 20px rgba(225, 29, 72, 0.25); margin: 12px 0 20px 0;">
          <div style="font-size: 0.9rem; font-weight: 600; opacity: 0.95; letter-spacing: 0.04em;">SPECIAL STUDENT OFFER</div>
          <div style="font-size: 2.8rem; font-weight: 900; line-height: 1; margin: 4px 0;">
            ${CONFIG.DISCOUNT_PERCENTAGE}% OFF
          </div>
          <div style="font-size: 0.85rem; font-weight: 600; opacity: 0.9;">
            For all Students
          </div>
        </div>

        <a href="#/claim" class="btn btn-primary" id="btn-goto-claim" style="font-size: 1.1rem;">
          Get My Coupon Now ⚡
        </a>
      </div>

      <!-- How it Works -->
      <div class="card">
        <h2 class="title-lg" style="margin-bottom: 16px; font-size: 1.15rem;">How It Works</h2>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-berry-50); color: var(--color-berry-600); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">1</div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">Scan Permanent Poster QR</div>
              <div class="text-muted" style="font-size: 0.82rem;">Scan the permanent QR on the Apsara promotional poster or open this link.</div>
            </div>
          </div>
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-berry-50); color: var(--color-berry-600); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">2</div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">Tap "Get My Coupon"</div>
              <div class="text-muted" style="font-size: 0.82rem;">Receive your unique one-time discount coupon with a secure QR code.</div>
            </div>
          </div>
          <div style="display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-berry-50); color: var(--color-berry-600); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">3</div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">Show at Counter</div>
              <div class="text-muted" style="font-size: 0.82rem;">Shop staff scans your coupon QR to instantly apply your 15% discount!</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permanent Poster QR Showcase Card -->
      <div class="card" style="text-align: center;">
        <h3 class="title-lg" style="font-size: 1.1rem; margin-bottom: 6px;">Official Promotional Poster QR</h3>
        <p class="text-muted" style="font-size: 0.82rem; margin-bottom: 16px;">
          This is the single permanent poster QR. It never expires and is reusable forever.
        </p>
        
        <div class="coupon-qr-container" style="margin: 0 auto 14px auto;">
          <canvas id="poster-qr-canvas"></canvas>
        </div>

        <div style="font-size: 0.75rem; color: var(--color-charcoal-500); word-break: break-all; margin-bottom: 14px; padding: 6px 10px; background: var(--color-cream-bg); border-radius: var(--radius-sm);">
          ${posterUrl}
        </div>

        <button id="btn-download-poster-qr" class="btn btn-secondary" style="font-size: 0.9rem; min-height: 44px;">
          📥 Download Print-Ready Poster QR
        </button>
      </div>

      <!-- Terms & Notes -->
      <div style="text-align: center; font-size: 0.75rem; color: var(--color-charcoal-500); padding: 8px 12px;">
        Valid for Students. One-time use per coupon. No login or phone number required.
      </div>
    </div>
  `;

  // Render poster QR code
  const canvas = container.querySelector('#poster-qr-canvas') as HTMLCanvasElement;
  if (canvas) {
    QRGenerator.renderToCanvas(canvas, posterUrl, { width: 200, margin: 1 });
  }

  // Handle download
  const downloadBtn = container.querySelector('#btn-download-poster-qr');
  if (downloadBtn && canvas) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'Apsara_DVHIMSR_Permanent_Poster_QR.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}
