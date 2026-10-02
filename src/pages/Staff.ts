/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Staff QR Scanner & Atomic Redemption Page
 */

import { Html5Qrcode } from 'html5-qrcode';
import { Api } from '../api';
import { Storage } from '../storage';
import { CONFIG } from '../config';

// Audio feedback using Web Audio API for zero dependencies
function playSound(type: 'success' | 'error') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'success') {
      navigator.vibrate([100, 50, 100]);
    } else {
      navigator.vibrate([250, 100, 250]);
    }
  }
}

export function renderStaff(container: HTMLElement): void {
  let html5QrCode: Html5Qrcode | null = null;
  let isScanning = false;
  let staffId = Storage.getStaffId();

  // Check URL query parameters (e.g. if staff opened link directly from phone QR reader)
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  const urlParams = new URLSearchParams(queryIndex !== -1 ? hash.substring(queryIndex + 1) : '');
  const urlToken = urlParams.get('token');

  container.innerHTML = `
    <div class="page-container">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h1 class="title-lg" style="margin: 0; font-size: 1.3rem;">Shop Staff Scanner</h1>
          <div class="text-muted" style="font-size: 0.8rem;">Apsara Ice Creams Counter Terminal</div>
        </div>
        <div style="text-align: right;">
          <input type="text" id="input-staff-id" value="${staffId}" title="Counter Identifier" style="font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-charcoal-200); width: 110px; text-align: right;" />
        </div>
      </div>

      <!-- Result Card Container (Hidden initially) -->
      <div id="redemption-result" style="display: none; margin-bottom: 20px;"></div>

      <!-- Scanner Container -->
      <div class="card" id="scanner-card" style="padding: 16px; text-align: center;">
        <div class="scanner-viewport">
          <div id="reader" style="width: 100%;"></div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button id="btn-toggle-scanner" class="btn btn-primary" style="flex: 1; min-height: 46px; font-size: 0.95rem;">
            📷 Start Camera Scanner
          </button>
        </div>

        <div id="camera-status" style="margin-top: 10px; font-size: 0.8rem; color: var(--color-charcoal-500);">
          Point camera at the student's coupon QR code.
        </div>
      </div>

      <!-- Manual Input Fallback Card -->
      <div class="card" style="padding: 18px 20px;">
        <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px; color: var(--color-charcoal-800);">
          ⌨️ Manual Verification Fallback
        </div>
        <p class="text-muted" style="font-size: 0.78rem; margin-bottom: 12px;">
          If the camera is unavailable, enter the secure token or coupon code:
        </p>

        <div style="display: flex; gap: 8px;">
          <input type="text" id="manual-token-input" placeholder="Paste coupon token or ID" style="flex: 1; padding: 10px 14px; border: 1px solid var(--color-cream-border); border-radius: var(--radius-md); font-family: monospace; font-size: 0.85rem;" />
          <button id="btn-manual-redeem" class="btn btn-secondary" style="width: auto; min-height: 42px; padding: 0 16px; font-size: 0.85rem;">
            Redeem
          </button>
        </div>
      </div>
    </div>
  `;

  const resultContainer = container.querySelector('#redemption-result') as HTMLElement;
  const toggleBtn = container.querySelector('#btn-toggle-scanner') as HTMLButtonElement;
  const cameraStatus = container.querySelector('#camera-status') as HTMLElement;
  const manualInput = container.querySelector('#manual-token-input') as HTMLInputElement;
  const manualBtn = container.querySelector('#btn-manual-redeem') as HTMLButtonElement;
  const staffInput = container.querySelector('#input-staff-id') as HTMLInputElement;

  if (staffInput) {
    staffInput.addEventListener('change', () => {
      staffId = staffInput.value.trim() || 'Staff Counter 1';
      Storage.setStaffId(staffId);
    });
  }

  // Handle scanned or entered token
  async function processRedemption(rawCode: string) {
    if (!rawCode) return;

    // Parse token if full redemption URL was scanned
    let token = rawCode.trim();
    if (token.includes('token=')) {
      try {
        const urlPart = token.substring(token.indexOf('?') + 1);
        const params = new URLSearchParams(urlPart);
        token = params.get('token') || token;
      } catch {}
    }

    // Stop scanner while processing
    if (html5QrCode && isScanning) {
      await stopScanner();
    }

    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 24px;">
        <span class="spinner" style="border-top-color: var(--color-berry-600); width: 32px; height: 32px;"></span>
        <div style="margin-top: 12px; font-weight: 700; color: var(--color-charcoal-700);">
          Verifying coupon with server...
        </div>
      </div>
    `;

    try {
      const res = await Api.redeem(token, staffId);

      if (res.success && res.code === 'VALID') {
        // State 1: VALID COUPON (Section 23)
        playSound('success');
        resultContainer.innerHTML = `
          <div class="result-card success">
            <div style="font-size: 3rem; line-height: 1; margin-bottom: 6px;">✓</div>
            <div style="font-size: 1.4rem; font-weight: 900; letter-spacing: 0.05em; color: #065F46;">
              VALID COUPON
            </div>
            <div style="font-size: 1.8rem; font-weight: 800; font-family: monospace; margin: 8px 0; color: #064E3B;">
              ${res.couponId}
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #047857; margin-bottom: 8px;">
              ${res.discountPercentage || CONFIG.DISCOUNT_PERCENTAGE}% OFF APPLIED
            </div>
            <p style="font-size: 0.85rem; color: #065F46; line-height: 1.3;">
              Coupon redeemed successfully for ${res.collegeName || CONFIG.COLLEGE_NAME} Student.
            </p>
            <div style="margin-top: 12px; font-weight: 700; font-size: 0.8rem; color: #064E3B; background: rgba(255,255,255,0.7); padding: 4px 12px; border-radius: var(--radius-full); display: inline-block;">
              STATUS: USED • ${new Date(res.redeemedAt).toLocaleTimeString()}
            </div>
            <div style="margin-top: 18px;">
              <button id="btn-scan-next" class="btn btn-success" style="font-size: 1rem; min-height: 48px;">
                Scan Next Coupon 📷
              </button>
            </div>
          </div>
        `;
      } else if (res.code === 'ALREADY_USED') {
        // State 2: ALREADY USED (Section 23)
        playSound('error');
        const redeemedTime = res.redeemedAt ? new Date(res.redeemedAt).toLocaleTimeString() : 'Earlier';
        resultContainer.innerHTML = `
          <div class="result-card already-used">
            <div style="font-size: 3rem; line-height: 1; margin-bottom: 6px;">✕</div>
            <div style="font-size: 1.3rem; font-weight: 900; letter-spacing: 0.04em; color: #991B1B;">
              COUPON ALREADY USED
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; margin: 8px 0; color: #7F1D1D;">
              ${res.couponId || 'COUPON'}
            </div>
            <p style="font-size: 0.9rem; font-weight: 600; color: #991B1B;">
              This coupon cannot be used again.
            </p>
            <div style="font-size: 0.78rem; color: #7F1D1D; margin-top: 6px;">
              Previously redeemed at: ${redeemedTime}
            </div>
            <div style="margin-top: 18px;">
              <button id="btn-scan-next" class="btn btn-secondary" style="font-size: 0.95rem; min-height: 48px;">
                Scan Another Coupon 🔄
              </button>
            </div>
          </div>
        `;
      } else if (res.code === 'CAMPAIGN_INACTIVE') {
        // State 3: CAMPAIGN INACTIVE
        playSound('error');
        resultContainer.innerHTML = `
          <div class="result-card invalid">
            <div style="font-size: 2.8rem; line-height: 1; margin-bottom: 6px;">⚠️</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #92400E;">
              CAMPAIGN INACTIVE
            </div>
            <p style="font-size: 0.85rem; color: #78350F; margin-top: 6px;">
              Coupon redemption is currently unavailable.
            </p>
            <div style="margin-top: 16px;">
              <button id="btn-scan-next" class="btn btn-secondary">Try Again</button>
            </div>
          </div>
        `;
      } else {
        // State 4: INVALID COUPON (Section 23)
        playSound('error');
        resultContainer.innerHTML = `
          <div class="result-card invalid">
            <div style="font-size: 2.8rem; line-height: 1; margin-bottom: 6px;">⚠️</div>
            <div style="font-size: 1.3rem; font-weight: 900; color: #92400E;">
              INVALID COUPON
            </div>
            <p style="font-size: 0.9rem; color: #78350F; margin-top: 6px;">
              This coupon could not be verified.
            </p>
            <div style="font-size: 0.75rem; color: #B45309; margin-top: 4px;">
              Please check that the student is presenting a valid DVHIMSR promotional coupon.
            </div>
            <div style="margin-top: 18px;">
              <button id="btn-scan-next" class="btn btn-secondary" style="font-size: 0.95rem; min-height: 48px;">
                Scan Next Coupon
              </button>
            </div>
          </div>
        `;
      }

      const scanNextBtn = resultContainer.querySelector('#btn-scan-next');
      if (scanNextBtn) {
        scanNextBtn.addEventListener('click', () => {
          resultContainer.style.display = 'none';
          startScanner();
        });
      }

    } catch (err: any) {
      playSound('error');
      resultContainer.innerHTML = `
        <div class="result-card invalid">
          <div style="font-weight: 800; color: #92400E;">Communication Error</div>
          <div style="font-size: 0.85rem; color: #78350F; margin-top: 6px;">${err.message || 'Server did not respond.'}</div>
          <div style="margin-top: 12px;">
            <button id="btn-scan-next" class="btn btn-secondary">Retry</button>
          </div>
        </div>
      `;
      const scanNextBtn = resultContainer.querySelector('#btn-scan-next');
      if (scanNextBtn) {
        scanNextBtn.addEventListener('click', () => {
          resultContainer.style.display = 'none';
          startScanner();
        });
      }
    }
  }

  // Scanner lifecycle
  async function startScanner() {
    try {
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('reader');
      }
      cameraStatus.textContent = 'Requesting camera access...';
      toggleBtn.disabled = true;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // On QR Decoded
          processRedemption(decodedText);
        },
        () => {
          // Frame scan error (ignored, continuous feed)
        }
      );

      isScanning = true;
      cameraStatus.textContent = 'Camera active. Point at customer coupon QR.';
      toggleBtn.disabled = false;
      toggleBtn.textContent = '⏹ Stop Camera';
      toggleBtn.className = 'btn btn-secondary';
    } catch (err: any) {
      isScanning = false;
      toggleBtn.disabled = false;
      toggleBtn.textContent = '📷 Start Camera Scanner';
      toggleBtn.className = 'btn btn-primary';

      const errorText = String(err).toLowerCase();
      if (errorText.includes('permission') || errorText.includes('notallowed')) {
        cameraStatus.innerHTML = `
          <span style="color: #DC2626; font-weight: 700;">Camera Permission Denied</span><br>
          Please enable camera permissions in your browser, or use the manual code entry below.
        `;
      } else {
        cameraStatus.innerHTML = `
          <span style="color: #DC2626; font-weight: 700;">Camera Unavailable</span><br>
          Could not open camera stream. Please use the manual code entry below.
        `;
      }
    }
  }

  async function stopScanner() {
    if (html5QrCode && isScanning) {
      try {
        await html5QrCode.stop();
      } catch {}
      isScanning = false;
      toggleBtn.textContent = '📷 Start Camera Scanner';
      toggleBtn.className = 'btn btn-primary';
      cameraStatus.textContent = 'Scanner paused.';
    }
  }

  toggleBtn.addEventListener('click', () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  });

  manualBtn.addEventListener('click', () => {
    const val = manualInput.value.trim();
    if (val) {
      processRedemption(val);
      manualInput.value = '';
    }
  });

  // If URL has token from direct phone scan, process immediately
  if (urlToken) {
    processRedemption(urlToken);
  }
}
