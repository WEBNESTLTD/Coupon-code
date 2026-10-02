/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Lightweight Client-Side Router
 */

import { renderHome } from './pages/Home';
import { renderClaim } from './pages/Claim';
import { renderCoupon } from './pages/Coupon';
import { renderStaff } from './pages/Staff';
import { renderAdmin } from './pages/Admin';

type RouteRenderer = (container: HTMLElement) => void;

interface RouteMap {
  [path: string]: RouteRenderer;
}

const routes: RouteMap = {
  '/': renderHome,
  '/claim': renderClaim,
  '/coupon': renderCoupon,
  '/staff': renderStaff,
  '/admin': renderAdmin
};

export class Router {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('popstate', () => this.handleRoute());
  }

  public init(): void {
    // Check if initial URL is path-based (e.g. /claim) on servers that rewrite
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (!window.location.hash && (path === '/claim' || path === '/coupon' || path === '/staff' || path === '/admin')) {
      window.location.hash = `#${path}`;
      return;
    }

    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleRoute();
    }
  }

  private handleRoute(): void {
    const rawHash = window.location.hash.slice(1) || '/';
    // Extract base route ignoring query strings
    const path = (rawHash.split('?')[0] || '/').toLowerCase();

    const renderer = routes[path] || routes['/'];

    // Update bottom nav active classes
    this.updateNavTabs(path);

    // Render page
    this.container.innerHTML = '';
    renderer(this.container);

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  private updateNavTabs(currentPath: string): void {
    const tabs = document.querySelectorAll('.bottom-tab, .nav-item');
    tabs.forEach((tab) => {
      const href = tab.getAttribute('href') || '';
      const tabPath = href.replace(/^#/, '').split('?')[0];

      if (tabPath === currentPath) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
}
