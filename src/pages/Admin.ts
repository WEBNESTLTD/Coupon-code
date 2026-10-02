/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Admin Dashboard Component
 * Metrics, Real-time Statistics, Coupon Lookup & Campaign Control
 */

import { Api } from '../api';

export function renderAdmin(container: HTMLElement): void {
  container.innerHTML = `
    <div class="page-container">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h1 class="title-lg" style="margin: 0;">Campaign Dashboard</h1>
          <div class="text-muted" style="font-size: 0.8rem;">Apsara × DVHIMSR Metrics & Controls</div>
        </div>
        <button id="btn-refresh-stats" class="btn btn-secondary" style="width: auto; min-height: 38px; padding: 0 14px; font-size: 0.8rem;">
          🔄 Refresh
        </button>
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
  const setActiveBtn = container.querySelector('#btn-set-active') as HTMLButtonElement;
  const setInactiveBtn = container.querySelector('#btn-set-inactive') as HTMLButtonElement;
  const searchInput = container.querySelector('#input-search-coupon') as HTMLInputElement;
  const searchBtn = container.querySelector('#btn-search-coupon') as HTMLButtonElement;
  const searchResult = container.querySelector('#search-result-container') as HTMLElement;
  const recentTable = container.querySelector('#recent-coupons-table') as HTMLElement;
  const resetMockBtn = container.querySelector('#btn-reset-mock') as HTMLButtonElement;

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

  // Initial load
  loadData();
}
