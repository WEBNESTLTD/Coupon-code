/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Admin Dashboard & Sign-In Component
 * Authenticated Portal for Metrics, Coupon Lookup & Campaign Control
 */

import { Api } from '../api';

const ADMIN_SESSION_KEY = 'apsara_admin_token';
const ADMIN_USER_KEY = 'apsara_admin_user';

export function renderAdmin(container: HTMLElement): void {
  const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!token) {
    renderAdminLogin(container);
  } else {
    renderAdminDashboard(container);
  }
}

function renderAdminLogin(container: HTMLElement): void {
  container.innerHTML = `
    <div class="page-container" style="justify-content: center; min-height: 75vh;">
      <div class="card" style="padding: 32px 24px; text-align: center; box-shadow: var(--shadow-lg);">
        <div style="width: 54px; height: 54px; background: var(--color-berry-50); color: var(--color-berry-600); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1.8rem; margin-bottom: 12px;">
          🔐
        </div>
        
        <h1 class="title-lg" style="margin-bottom: 4px;">Admin Portal</h1>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 24px;">
          Sign in to access campaign analytics & controls
        </p>

        <form id="admin-login-form" style="text-align: left; display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label for="admin-username" style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--color-charcoal-700); margin-bottom: 6px;">
              Username
            </label>
            <input 
              type="text" 
              id="admin-username" 
              required 
              autocomplete="username"
              placeholder="e.g. admin" 
              style="width: 100%; padding: 12px 14px; border: 1px solid var(--color-cream-border); border-radius: var(--radius-md); font-size: 0.95rem; font-family: inherit;"
            />
          </div>

          <div>
            <label for="admin-password" style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--color-charcoal-700); margin-bottom: 6px;">
              Password
            </label>
            <input 
              type="password" 
              id="admin-password" 
              required 
              autocomplete="current-password"
              placeholder="••••••••••••" 
              style="width: 100%; padding: 12px 14px; border: 1px solid var(--color-cream-border); border-radius: var(--radius-md); font-size: 0.95rem; font-family: inherit;"
            />
          </div>

          <div id="login-error-msg" style="display: none; background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; padding: 10px; border-radius: var(--radius-md); font-size: 0.82rem;"></div>

          <button type="submit" id="btn-admin-submit" class="btn btn-primary" style="margin-top: 8px;">
            <span id="btn-login-text">Sign In →</span>
          </button>
        </form>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-cream-border); font-size: 0.75rem; color: var(--color-charcoal-500); line-height: 1.4;">
          Credentials can also be configured directly in your Google Spreadsheet’s <strong>Settings</strong> sheet.
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#admin-login-form') as HTMLFormElement;
  const userInput = container.querySelector('#admin-username') as HTMLInputElement;
  const passInput = container.querySelector('#admin-password') as HTMLInputElement;
  const submitBtn = container.querySelector('#btn-admin-submit') as HTMLButtonElement;
  const btnText = container.querySelector('#btn-login-text') as HTMLElement;
  const errorMsg = container.querySelector('#login-error-msg') as HTMLElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) return;

    submitBtn.disabled = true;
    btnText.innerHTML = `<span class="spinner"></span> Verifying...`;
    errorMsg.style.display = 'none';

    try {
      const res = await Api.adminLogin(username, password);
      if (res.success && res.adminToken) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, res.adminToken);
        sessionStorage.setItem(ADMIN_USER_KEY, username);
        renderAdminDashboard(container);
      } else {
        errorMsg.textContent = res.message || 'Invalid username or password. Please try again.';
        errorMsg.style.display = 'block';
      }
    } catch (err: any) {
      errorMsg.textContent = err.message || 'Connection error. Please try again.';
      errorMsg.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Sign In →';
    }
  });
}

function renderAdminDashboard(container: HTMLElement): void {
  const loggedInUser = sessionStorage.getItem(ADMIN_USER_KEY) || 'admin';

  container.innerHTML = `
    <div class="page-container">
      <!-- Admin Top Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h1 class="title-lg" style="margin: 0;">Campaign Dashboard</h1>
          <div class="text-muted" style="font-size: 0.78rem;">
            Logged in as <strong>${loggedInUser}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-refresh-stats" class="btn btn-secondary" style="width: auto; min-height: 38px; padding: 0 12px; font-size: 0.8rem;">
            🔄 Refresh
          </button>
          <button id="btn-admin-logout" class="btn btn-secondary" style="width: auto; min-height: 38px; padding: 0 12px; font-size: 0.8rem; color: #DC2626;">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div id="stats-grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div class="card" style="padding: 16px; margin: 0; text-align: center;">
          <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Total Generated</div>
          <div id="stat-generated" style="font-size: 2rem; font-weight: 900; color: var(--color-berry-900);">--</div>
        </div>
        <div class="card" style="padding: 16px; margin: 0; text-align: center;">
          <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Total Redeemed</div>
          <div id="stat-redeemed" style="font-size: 2rem; font-weight: 900; color: #059669;">--</div>
        </div>
        <div class="card" style="padding: 16px; margin: 0; text-align: center;">
          <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Total Unused</div>
          <div id="stat-unused" style="font-size: 2rem; font-weight: 900; color: var(--color-caramel-600);">--</div>
        </div>
        <div class="card" style="padding: 16px; margin: 0; text-align: center;">
          <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Remaining Cap</div>
          <div id="stat-remaining" style="font-size: 2rem; font-weight: 900; color: var(--color-charcoal-700);">--</div>
        </div>
      </div>

      <!-- Campaign Status Control Card -->
      <div class="card" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">Campaign Status</div>
            <div class="text-muted" style="font-size: 0.78rem;">Controls claim & redemption availability</div>
          </div>
          <div>
            <span id="badge-campaign-status" class="status-pill status-active">ACTIVE</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button id="btn-set-active" class="btn btn-secondary" style="flex: 1; min-height: 40px; font-size: 0.85rem;">
            🟢 Set Active
          </button>
          <button id="btn-set-inactive" class="btn btn-secondary" style="flex: 1; min-height: 40px; font-size: 0.85rem;">
            🔴 Set Inactive
          </button>
        </div>

        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--color-cream-border);">
          <button id="btn-reset-coupons" class="btn btn-secondary" style="width: 100%; min-height: 40px; font-size: 0.85rem; color: #dc2626; border-color: #fca5a5; background: #fff5f5;">
            🗑️ Reset All Generated Coupons
          </button>
        </div>
      </div>

      <!-- Coupon Search Card -->
      <div class="card" style="padding: 20px;">
        <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 8px;">Inspect Coupon Record</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="input-search-coupon" placeholder="e.g. DVHIMSR-001" style="flex: 1; padding: 10px 14px; border: 1px solid var(--color-cream-border); border-radius: var(--radius-md); font-family: monospace; font-size: 0.9rem;" />
          <button id="btn-search-coupon" class="btn btn-primary" style="width: auto; min-height: 42px; padding: 0 16px; font-size: 0.85rem;">
            Search
          </button>
        </div>
        <div id="search-result-container" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Recent Redemptions Table Card -->
      <div class="card" style="padding: 20px;">
        <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 12px;">Recent Coupons Log</div>
        <div id="recent-coupons-table" style="font-size: 0.8rem; overflow-x: auto;">
          <div class="text-muted" style="text-align: center; padding: 12px;">Loading recent activity...</div>
        </div>
      </div>

      <!-- Quick Reset Mock Data (Development helper) -->
      <div style="text-align: center; margin-top: 10px;">
        <button id="btn-reset-mock" style="background: none; border: none; font-size: 0.72rem; color: var(--color-charcoal-500); text-decoration: underline; cursor: pointer;">
          Reset Local Mock Data (Testing Only)
        </button>
      </div>
    </div>
  `;

  const statGen = container.querySelector('#stat-generated') as HTMLElement;
  const statRed = container.querySelector('#stat-redeemed') as HTMLElement;
  const statUnused = container.querySelector('#stat-unused') as HTMLElement;
  const statRem = container.querySelector('#stat-remaining') as HTMLElement;
  const statusBadge = container.querySelector('#badge-campaign-status') as HTMLElement;
  const refreshBtn = container.querySelector('#btn-refresh-stats') as HTMLButtonElement;
  const logoutBtn = container.querySelector('#btn-admin-logout') as HTMLButtonElement;
  const setActiveBtn = container.querySelector('#btn-set-active') as HTMLButtonElement;
  const setInactiveBtn = container.querySelector('#btn-set-inactive') as HTMLButtonElement;
  const searchInput = container.querySelector('#input-search-coupon') as HTMLInputElement;
  const searchBtn = container.querySelector('#btn-search-coupon') as HTMLButtonElement;
  const searchResult = container.querySelector('#search-result-container') as HTMLElement;
  const recentTable = container.querySelector('#recent-coupons-table') as HTMLElement;
  const resetMockBtn = container.querySelector('#btn-reset-mock') as HTMLButtonElement;
  const resetCouponsBtn = container.querySelector('#btn-reset-coupons') as HTMLButtonElement;

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    renderAdmin(container);
  });

  async function loadData() {
    try {
      const statsRes = await Api.getStats();
      if (statsRes.success) {
        statGen.textContent = String(statsRes.totalGenerated);
        statRed.textContent = String(statsRes.totalRedeemed);
        statUnused.textContent = String(statsRes.totalUnused);
        statRem.textContent = String(statsRes.remaining);

        if (statsRes.campaignStatus === 'ACTIVE') {
          statusBadge.textContent = 'ACTIVE';
          statusBadge.className = 'status-pill status-active';
        } else {
          statusBadge.textContent = 'INACTIVE';
          statusBadge.className = 'status-pill status-inactive';
        }
      }

      const recentRes = await Api.getRecent(15);
      if (recentRes.success && recentRes.recent) {
        if (recentRes.recent.length === 0) {
          recentTable.innerHTML = `<div class="text-muted" style="text-align: center; padding: 12px;">No coupons issued yet.</div>`;
        } else {
          recentTable.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-cream-border); color: var(--color-charcoal-500);">
                  <th style="padding: 6px 8px;">Coupon ID</th>
                  <th style="padding: 6px 8px;">Status</th>
                  <th style="padding: 6px 8px;">Time</th>
                </tr>
              </thead>
              <tbody>
                ${recentRes.recent.map((c: any) => `
                  <tr style="border-bottom: 1px solid var(--color-cream-border);">
                    <td style="padding: 8px; font-weight: 800; font-family: monospace;">${c.couponId}</td>
                    <td style="padding: 8px;">
                      <span class="status-pill ${c.status === 'USED' ? 'status-used' : 'status-unused'}" style="font-size: 0.7rem; padding: 2px 8px;">
                        ${c.status}
                      </span>
                    </td>
                    <td style="padding: 8px; font-size: 0.72rem; color: var(--color-charcoal-500);">
                      ${c.redeemedAt ? new Date(c.redeemedAt).toLocaleTimeString() : new Date(c.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }
    } catch (err: any) {
      console.warn('Admin load error', err);
    }
  }

  refreshBtn.addEventListener('click', () => loadData());

  setActiveBtn.addEventListener('click', async () => {
    await Api.setCampaignStatus('ACTIVE');
    loadData();
  });

  setInactiveBtn.addEventListener('click', async () => {
    await Api.setCampaignStatus('INACTIVE');
    loadData();
  });

  searchBtn.addEventListener('click', async () => {
    const val = searchInput.value.trim();
    if (!val) return;

    searchResult.style.display = 'block';
    searchResult.innerHTML = `<div class="text-muted" style="font-size: 0.8rem;">Searching...</div>`;

    const res = await Api.search(val);
    if (res.success && res.coupon) {
      const c = res.coupon;
      searchResult.innerHTML = `
        <div style="background: var(--color-cream-bg); padding: 12px; border-radius: var(--radius-md); font-size: 0.8rem; line-height: 1.5;">
          <div style="font-weight: 800; font-family: monospace; font-size: 1.1rem; color: var(--color-berry-900);">${c.couponId}</div>
          <div>Status: <strong>${c.status}</strong></div>
          <div>Created: ${new Date(c.createdAt).toLocaleString()}</div>
          ${c.redeemedAt ? `<div>Redeemed: ${new Date(c.redeemedAt).toLocaleString()} by ${c.redeemedBy || 'Staff'}</div>` : ''}
        </div>
      `;
    } else {
      searchResult.innerHTML = `
        <div style="background: #FEE2E2; color: #991B1B; padding: 10px; border-radius: var(--radius-md); font-size: 0.8rem;">
          ${res.message || 'Coupon not found.'}
        </div>
      `;
    }
  });

  resetMockBtn.addEventListener('click', () => {
    if (confirm('Reset local mock database to clean initial state?')) {
      Api.resetMock();
      loadData();
    }
  });

  if (resetCouponsBtn) {
    resetCouponsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete and reset all generated coupons? This will clear the recent coupons log and restart the coupon counter back to #001.')) {
        resetCouponsBtn.disabled = true;
        resetCouponsBtn.textContent = 'Resetting...';
        try {
          const res = await Api.resetAllCoupons();
          alert(res.message || 'All coupons reset successfully.');
          await loadData();
        } catch (e: any) {
          alert('Error: ' + (e.message || 'Failed to reset coupons.'));
        } finally {
          resetCouponsBtn.disabled = false;
          resetCouponsBtn.textContent = '🗑️ Reset All Generated Coupons';
        }
      }
    });
  }

  // Initial load
  loadData();
}
