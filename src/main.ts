/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Application Entry Point
 */

import './styles/main.css';
import { Router } from './router';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Build Shell Layout
  appContainer.innerHTML = `
    <!-- Top Header -->
    <header class="app-header">
      <a href="#/" class="brand-badge">
        <div class="brand-icon">🍦</div>
        <div class="brand-text">
          <div class="brand-name">Apsara Ice Creams</div>
          <div class="brand-collab">DVHIMSR Student Pass</div>
        </div>
      </a>
      <div class="nav-links">
        <a href="#/claim" class="nav-item" style="font-weight: 700; color: var(--color-berry-600);">Claim</a>
        <a href="#/staff" class="nav-item">Staff</a>
      </div>
    </header>

    <!-- Main View Dynamic Container -->
    <main id="main-content" style="flex: 1; display: flex; flex-direction: column;"></main>

    <!-- Mobile Fixed Bottom Navigation -->
    <nav class="bottom-nav">
      <a href="#/" class="bottom-tab active">
        <span class="bottom-tab-icon">🏠</span>
        <span>Home</span>
      </a>
      <a href="#/claim" class="bottom-tab">
        <span class="bottom-tab-icon">🎟️</span>
        <span>Claim</span>
      </a>
      <a href="#/coupon" class="bottom-tab">
        <span class="bottom-tab-icon">🍦</span>
        <span>My Coupon</span>
      </a>
      <a href="#/staff" class="bottom-tab">
        <span class="bottom-tab-icon">📷</span>
        <span>Staff</span>
      </a>
      <a href="#/admin" class="bottom-tab">
        <span class="bottom-tab-icon">📊</span>
        <span>Admin</span>
      </a>
    </nav>
  `;

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    const router = new Router(mainContent);
    router.init();
  }
});
