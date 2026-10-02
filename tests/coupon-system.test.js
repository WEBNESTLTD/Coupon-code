import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

/**
 * Concurrency-safe Mock Engine reflecting Google Apps Script & Google Sheets
 * Uses an asynchronous lock mechanism mirroring LockService.getScriptLock()
 */
class AsyncLock {
  constructor() {
    this.locked = false;
    this.waiting = [];
  }

  async acquire(timeoutMs = 30000) {
    if (!this.locked) {
      this.locked = true;
      return true;
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const index = this.waiting.indexOf(grant);
        if (index !== -1) {
          this.waiting.splice(index, 1);
          resolve(false);
        }
      }, timeoutMs);

      const grant = () => {
        clearTimeout(timer);
        this.locked = true;
        resolve(true);
      };

      this.waiting.push(grant);
    });
  }

  release() {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

class MockGoogleSheetStore {
  constructor() {
    this.lock = new AsyncLock();
    this.reset();
  }

  reset() {
    this.settings = {
      campaignId: 'APSARA-DVHIMSR-2026',
      campaignName: 'Apsara Ice Creams × DVHIMSR Student Offer',
      collegeName: 'DVHIMSR',
      discountPercentage: 15,
      couponPrefix: 'DVHIMSR',
      startingNumber: 1,
      maximumCoupons: 500,
      campaignStatus: 'ACTIVE'
    };
    this.coupons = []; // Rows representing the "Coupons" sheet
  }

  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async claimCoupon(claimRequestId) {
    if (!claimRequestId || typeof claimRequestId !== 'string' || claimRequestId.trim().length < 8) {
      return { success: false, code: 'INVALID_REQUEST_ID', message: 'A valid claim request identifier is required.' };
    }

    const acquired = await this.lock.acquire(30000);
    if (!acquired) {
      return { success: false, code: 'SERVER_BUSY', message: 'The server is currently busy processing other claims.' };
    }

    try {
      // 1. Check campaign status
      if (this.settings.campaignStatus !== 'ACTIVE') {
        return { success: false, code: 'CAMPAIGN_INACTIVE', message: 'This offer is currently unavailable.' };
      }

      // 2. Check idempotency: does claimRequestId already exist?
      const existing = this.coupons.find(c => c.claimRequestId === claimRequestId.trim());
      if (existing) {
        return {
          success: true,
          couponId: existing.couponId,
          token: existing.token,
          status: existing.status,
          alreadyCreated: true,
          campaignId: existing.campaignId,
          collegeName: this.settings.collegeName,
          discountPercentage: this.settings.discountPercentage,
          message: 'Existing coupon recovered.'
        };
      }

      // 3. Check maximum coupon limit
      if (this.coupons.length >= this.settings.maximumCoupons) {
        return { success: false, code: 'LIMIT_REACHED', message: 'This offer has reached its maximum coupon limit.' };
      }

      // 4. Sequential allocation
      const nextNum = this.coupons.length + this.settings.startingNumber;
      if (nextNum > this.settings.maximumCoupons) {
        return { success: false, code: 'LIMIT_REACHED', message: 'This offer has reached its maximum coupon limit.' };
      }

      const paddedNumber = String(nextNum).padStart(3, '0');
      const couponId = `${this.settings.couponPrefix.toUpperCase()}-${paddedNumber}`;
      const secureToken = this.generateSecureToken();

      const newCoupon = {
        couponId,
        token: secureToken,
        status: 'UNUSED',
        createdAt: new Date().toISOString(),
        redeemedAt: '',
        redeemedBy: '',
        campaignId: this.settings.campaignId,
        claimRequestId: claimRequestId.trim()
      };

      this.coupons.push(newCoupon);

      return {
        success: true,
        couponId,
        token: secureToken,
        status: 'UNUSED',
        alreadyCreated: false,
        campaignId: this.settings.campaignId,
        collegeName: this.settings.collegeName,
        discountPercentage: this.settings.discountPercentage,
        message: 'Coupon generated successfully.'
      };
    } finally {
      this.lock.release();
    }
  }

  async redeemCoupon(token, staffId = 'Staff Counter') {
    if (!token || typeof token !== 'string') {
      return { success: false, code: 'INVALID_COUPON', message: 'This coupon could not be verified.' };
    }

    const acquired = await this.lock.acquire(30000);
    if (!acquired) {
      return { success: false, code: 'SERVER_BUSY', message: 'Redemption system is busy.' };
    }

    try {
      if (this.settings.campaignStatus !== 'ACTIVE') {
        return { success: false, code: 'CAMPAIGN_INACTIVE', message: 'Coupon redemption is currently unavailable.' };
      }

      const coupon = this.coupons.find(c => c.token === token.trim());
      if (!coupon) {
        return { success: false, code: 'INVALID_COUPON', message: 'This coupon could not be verified.' };
      }

      if (coupon.status === 'USED') {
        return {
          success: false,
          code: 'ALREADY_USED',
          couponId: coupon.couponId,
          redeemedAt: coupon.redeemedAt,
          message: 'This coupon cannot be used again.'
        };
      }

      const redeemedAt = new Date().toISOString();
      coupon.status = 'USED';
      coupon.redeemedAt = redeemedAt;
      coupon.redeemedBy = staffId;

      return {
        success: true,
        code: 'VALID',
        couponId: coupon.couponId,
        collegeName: this.settings.collegeName,
        discountPercentage: this.settings.discountPercentage,
        redeemedAt,
        status: 'USED',
        message: 'Coupon redeemed successfully.'
      };
    } finally {
      this.lock.release();
    }
  }

  getStats() {
    const totalGenerated = this.coupons.length;
    const totalRedeemed = this.coupons.filter(c => c.status === 'USED').length;
    const totalUnused = totalGenerated - totalRedeemed;
    const remaining = Math.max(0, this.settings.maximumCoupons - totalGenerated);

    return {
      campaignId: this.settings.campaignId,
      campaignStatus: this.settings.campaignStatus,
      maximumCoupons: this.settings.maximumCoupons,
      totalGenerated,
      totalRedeemed,
      totalUnused,
      remaining
    };
  }
}

describe('APSARA × DVHIMSR STUDENT COUPON SYSTEM - MASTER VERIFICATION', () => {
  let store;

  beforeEach(() => {
    store = new MockGoogleSheetStore();
  });

  describe('1. Critical Claim Test Matrix (Section 42)', () => {
    test('Scenario 1: First claim (Request A) produces DVHIMSR-001', async () => {
      const res = await store.claimCoupon('req-alpha-1111');
      assert.equal(res.success, true);
      assert.equal(res.couponId, 'DVHIMSR-001');
      assert.equal(res.alreadyCreated, false);
      assert.equal(res.status, 'UNUSED');
    });

    test('Scenario 2: Same request retry (Request A) returns DVHIMSR-001 with alreadyCreated: true', async () => {
      await store.claimCoupon('req-alpha-1111');
      const retryRes = await store.claimCoupon('req-alpha-1111');
      assert.equal(retryRes.success, true);
      assert.equal(retryRes.couponId, 'DVHIMSR-001');
      assert.equal(retryRes.alreadyCreated, true);
    });

    test('Scenario 3: Double-click (rapid duplicate Request A) returns same coupon', async () => {
      const [res1, res2] = await Promise.all([
        store.claimCoupon('req-alpha-1111'),
        store.claimCoupon('req-alpha-1111')
      ]);
      assert.equal(res1.couponId, 'DVHIMSR-001');
      assert.equal(res2.couponId, 'DVHIMSR-001');
      assert.equal(store.coupons.length, 1);
    });

    test('Scenario 4: Network retry after simulated timeout returns same coupon', async () => {
      const res1 = await store.claimCoupon('req-alpha-1111');
      // Simulate frontend re-trying with the same claimRequestId
      const resRetry = await store.claimCoupon('req-alpha-1111');
      assert.equal(resRetry.couponId, res1.couponId);
      assert.equal(store.coupons.length, 1);
    });

    test('Scenario 5: New intentional claim (Request B) produces DVHIMSR-002', async () => {
      await store.claimCoupon('req-alpha-1111');
      const resB = await store.claimCoupon('req-bravo-2222');
      assert.equal(resB.success, true);
      assert.equal(resB.couponId, 'DVHIMSR-002');
      assert.equal(resB.alreadyCreated, false);
    });

    test('Scenario 6: New student claim (Request C) produces DVHIMSR-003', async () => {
      await store.claimCoupon('req-alpha-1111');
      await store.claimCoupon('req-bravo-2222');
      const resC = await store.claimCoupon('req-charlie-3333');
      assert.equal(resC.success, true);
      assert.equal(resC.couponId, 'DVHIMSR-003');
    });

    test('Scenario 7: Same poster scanned again by first student (Request D) produces DVHIMSR-004', async () => {
      await store.claimCoupon('req-alpha-1111');
      await store.claimCoupon('req-bravo-2222');
      await store.claimCoupon('req-charlie-3333');
      // Student returns, starts a new claim session with fresh UUID
      const resD = await store.claimCoupon('req-delta-4444');
      assert.equal(resD.success, true);
      assert.equal(resD.couponId, 'DVHIMSR-004');
    });

    test('Scenario 8: Same coupon scanned twice at shop -> first succeeds, second rejected', async () => {
      const claim = await store.claimCoupon('req-alpha-1111');
      const scan1 = await store.redeemCoupon(claim.token, 'Staff Terminal 1');
      assert.equal(scan1.success, true);
      assert.equal(scan1.code, 'VALID');
      assert.equal(scan1.couponId, 'DVHIMSR-001');

      const scan2 = await store.redeemCoupon(claim.token, 'Staff Terminal 2');
      assert.equal(scan2.success, false);
      assert.equal(scan2.code, 'ALREADY_USED');
      assert.equal(scan2.couponId, 'DVHIMSR-001');
    });
  });

  describe('2. Concurrency Stress Test: 100 Simultaneous NEW Claims (Section 43)', () => {
    test('100 concurrent unique claim requests generate DVHIMSR-001 through DVHIMSR-100 without duplicates or gaps', async () => {
      const numRequests = 100;
      const requestIds = Array.from({ length: numRequests }, (_, i) => `req-concurrent-uuid-${i + 1}`);

      // Fire all 100 requests simultaneously
      const results = await Promise.all(requestIds.map(id => store.claimCoupon(id)));

      // Assert all succeeded
      for (const res of results) {
        assert.equal(res.success, true);
      }

      // Collect all generated coupon IDs
      const couponIds = results.map(r => r.couponId);
      const uniqueIds = new Set(couponIds);

      // Verify exactly 100 unique coupons
      assert.equal(uniqueIds.size, 100);

      // Verify sequence from DVHIMSR-001 to DVHIMSR-100
      for (let i = 1; i <= 100; i++) {
        const expectedId = `DVHIMSR-${String(i).padStart(3, '0')}`;
        assert.ok(uniqueIds.has(expectedId), `Missing expected coupon ID: ${expectedId}`);
      }

      assert.equal(store.coupons.length, 100);
    });
  });

  describe('3. Concurrency Stress Test: 100 Simultaneous DUPLICATE Requests with SAME claimRequestId (Section 43)', () => {
    test('100 concurrent requests with the SAME claimRequestId all return the SAME coupon and allocate only 1 number', async () => {
      const fixedId = 'req-duplicate-stress-test-uuid-999';
      const requests = Array.from({ length: 100 }, () => store.claimCoupon(fixedId));

      const results = await Promise.all(requests);

      // All 100 must succeed
      for (const res of results) {
        assert.equal(res.success, true);
        assert.equal(res.couponId, 'DVHIMSR-001');
      }

      // Exactly ONE coupon must exist in the database
      assert.equal(store.coupons.length, 1);
    });
  });

  describe('4. Concurrency Stress Test: Simultaneous Redemptions of Same Coupon (Section 43)', () => {
    test('Simultaneous redemption attempts of the same coupon result in exactly 1 SUCCESS and all remaining ALREADY_USED', async () => {
      const claim = await store.claimCoupon('req-redemption-test-uuid-777');
      const token = claim.token;

      // 50 simultaneous staff scan attempts on the same coupon token
      const scanAttempts = Array.from({ length: 50 }, (_, i) => 
        store.redeemCoupon(token, `Staff-Device-${i + 1}`)
      );

      const results = await Promise.all(scanAttempts);

      const successes = results.filter(r => r.success === true);
      const alreadyUsed = results.filter(r => r.success === false && r.code === 'ALREADY_USED');

      assert.equal(successes.length, 1, 'Exactly one redemption must succeed');
      assert.equal(alreadyUsed.length, 49, 'All other 49 attempts must be rejected with ALREADY_USED');
    });
  });

  describe('5. Campaign Limit Enforcement (500 Maximum Coupons)', () => {
    test('Capped at 500 coupons: Coupon 500 succeeds, Coupon 501 is rejected with LIMIT_REACHED', async () => {
      // Set starting coupon count directly for fast test
      store.coupons = Array.from({ length: 499 }, (_, i) => ({
        couponId: `DVHIMSR-${String(i + 1).padStart(3, '0')}`,
        token: `token-${i + 1}`,
        status: 'UNUSED',
        createdAt: new Date().toISOString(),
        redeemedAt: '',
        redeemedBy: '',
        campaignId: 'APSARA-DVHIMSR-2026',
        claimRequestId: `prefilled-req-${i + 1}`
      }));

      // Claim #500
      const res500 = await store.claimCoupon('req-claim-number-500');
      assert.equal(res500.success, true);
      assert.equal(res500.couponId, 'DVHIMSR-500');

      // Claim #501
      const res501 = await store.claimCoupon('req-claim-number-501');
      assert.equal(res501.success, false);
      assert.equal(res501.code, 'LIMIT_REACHED');
      assert.equal(res501.message, 'This offer has reached its maximum coupon limit.');

      // Database should contain exactly 500 coupons
      assert.equal(store.coupons.length, 500);
    });
  });

  describe('6. Campaign Inactive Behavior (Section 25)', () => {
    test('When campaign is INACTIVE, claim is rejected with CAMPAIGN_INACTIVE', async () => {
      store.settings.campaignStatus = 'INACTIVE';
      const claimRes = await store.claimCoupon('req-during-inactive');
      assert.equal(claimRes.success, false);
      assert.equal(claimRes.code, 'CAMPAIGN_INACTIVE');
      assert.equal(claimRes.message, 'This offer is currently unavailable.');
    });

    test('When campaign is INACTIVE, redemption is rejected with CAMPAIGN_INACTIVE', async () => {
      // First claim while active
      const claim = await store.claimCoupon('req-valid-prior');
      // Set to inactive
      store.settings.campaignStatus = 'INACTIVE';
      const redeemRes = await store.redeemCoupon(claim.token);
      assert.equal(redeemRes.success, false);
      assert.equal(redeemRes.code, 'CAMPAIGN_INACTIVE');
      assert.equal(redeemRes.message, 'Coupon redemption is currently unavailable.');
    });
  });

  describe('7. Token Security & Validation', () => {
    test('Redemption with invalid/fake token fails with INVALID_COUPON', async () => {
      const redeemRes = await store.redeemCoupon('completely-bogus-token-12345');
      assert.equal(redeemRes.success, false);
      assert.equal(redeemRes.code, 'INVALID_COUPON');
      assert.equal(redeemRes.message, 'This coupon could not be verified.');
    });
  });

  describe('8. Admin Statistics Accuracy', () => {
    test('Stats accurately reflect total generated, total redeemed, unused, and remaining', async () => {
      const c1 = await store.claimCoupon('req-admin-1');
      const c2 = await store.claimCoupon('req-admin-2');
      await store.claimCoupon('req-admin-3');

      // Redeem 2 of them
      await store.redeemCoupon(c1.token);
      await store.redeemCoupon(c2.token);

      const stats = store.getStats();
      assert.equal(stats.totalGenerated, 3);
      assert.equal(stats.totalRedeemed, 2);
      assert.equal(stats.totalUnused, 1);
      assert.equal(stats.remaining, 497); // 500 - 3
    });
  });
});
