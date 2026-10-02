/**
 * APSARA ICE CREAMS × DVHIMSR STUDENT COUPON SYSTEM
 * Production Web App Integration Verification Script
 *
 * Usage:
 *   node scripts/verify-production.js <WEB_APP_URL>
 * or
 *   APPS_SCRIPT_URL="https://script.google.com/..." node scripts/verify-production.js
 */

const targetUrl = process.argv[2] || process.env.APPS_SCRIPT_URL;

if (!targetUrl) {
  console.error('\x1b[31m[ERROR]\x1b[0m Missing Google Apps Script Web App URL.');
  console.log('\nUsage:');
  console.log('  node scripts/verify-production.js https://script.google.com/macros/s/AKfycb.../exec\n');
  process.exit(1);
}

console.log('\x1b[36m====================================================\x1b[0m');
console.log('\x1b[36m  APSARA × DVHIMSR LIVE PRODUCTION INTEGRATION TEST  \x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m');
console.log(`Target Web App URL: ${targetUrl}\n`);

async function callApi(params) {
  const url = new URL(targetUrl);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
  }
}

async function run() {
  const results = {};
  const runId = 'test_' + Date.now();

  try {
    // 1. Check Status
    console.log('[1/8] Testing Campaign Status endpoint...');
    const statusRes = await callApi({ action: 'status' });
    if (statusRes.success && statusRes.campaignId === 'APSARA-DVHIMSR-2026') {
      console.log('  \x1b[32m✔ PASS\x1b[0m: Status responded with campaign:', statusRes.campaignName);
      results.status = 'PASS';
    } else {
      throw new Error(`Status check failed: ${JSON.stringify(statusRes)}`);
    }

    // 2. Real First Claim (Step 4)
    console.log('\n[2/8] Testing First Real Claim (Step 4)...');
    const req1 = `${runId}_req_1`;
    const claim1 = await callApi({ action: 'claim', claimRequestId: req1 });
    if (claim1.success && claim1.couponId && claim1.token) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Allocated Coupon: ${claim1.couponId} (status: ${claim1.status})`);
      results.realClaim = 'PASS';
    } else {
      throw new Error(`Claim failed: ${JSON.stringify(claim1)}`);
    }

    // 3. Duplicate Claim Request Test (Step 5)
    console.log('\n[3/8] Testing Duplicate Claim with SAME claimRequestId (Step 5)...');
    const claimDuplicate = await callApi({ action: 'claim', claimRequestId: req1 });
    if (claimDuplicate.success && claimDuplicate.couponId === claim1.couponId && claimDuplicate.alreadyCreated === true) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Correctly returned same coupon ${claimDuplicate.couponId} without incrementing (alreadyCreated: true)`);
      results.duplicateClaim = 'PASS';
    } else {
      throw new Error(`Idempotency failed: Expected ${claim1.couponId}, got ${JSON.stringify(claimDuplicate)}`);
    }

    // 4. Intentional New Claim (Step 6)
    console.log('\n[4/8] Testing Genuinely New Claim Session (Step 6)...');
    const req2 = `${runId}_req_2`;
    const claim2 = await callApi({ action: 'claim', claimRequestId: req2 });
    if (claim2.success && claim2.couponId !== claim1.couponId) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Next sequential coupon allocated: ${claim2.couponId}`);
      results.newClaim = 'PASS';
    } else {
      throw new Error(`New claim failed: ${JSON.stringify(claim2)}`);
    }

    // 5. Repeat Poster Scan Claim (Step 7)
    console.log('\n[5/8] Testing Repeat Poster Scan Claim (Step 7)...');
    const req3 = `${runId}_req_3`;
    const claim3 = await callApi({ action: 'claim', claimRequestId: req3 });
    if (claim3.success && claim3.couponId !== claim2.couponId) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Repeat scan successfully generated new coupon: ${claim3.couponId}`);
      results.repeatPosterScan = 'PASS';
    } else {
      throw new Error(`Repeat poster claim failed: ${JSON.stringify(claim3)}`);
    }

    // 6. Real Staff Redemption (Step 9)
    console.log('\n[6/8] Testing Real Staff Redemption (Step 9)...');
    const redeem1 = await callApi({ action: 'redeem', token: claim1.token, staffId: 'Live-Test-Counter' });
    if (redeem1.success && redeem1.code === 'VALID' && redeem1.status === 'USED') {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Coupon ${redeem1.couponId} redeemed successfully (15% OFF applied)`);
      results.redemption = 'PASS';
    } else {
      throw new Error(`Redemption failed: ${JSON.stringify(redeem1)}`);
    }

    // 7. Repeat Redemption Protection (Step 10)
    console.log('\n[7/8] Testing Double Redemption Rejection (Step 10)...');
    const redeemDuplicate = await callApi({ action: 'redeem', token: claim1.token, staffId: 'Live-Test-Counter' });
    if (!redeemDuplicate.success && redeemDuplicate.code === 'ALREADY_USED') {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: Duplicate redemption correctly rejected with ALREADY_USED`);
      results.repeatRedemption = 'PASS';
    } else {
      throw new Error(`Double redemption protection failed: ${JSON.stringify(redeemDuplicate)}`);
    }

    // 8. Live Concurrency Race Test (Step 11)
    console.log('\n[8/8] Testing Live Concurrency (10 simultaneous duplicate requests)...');
    const concurrentReqId = `${runId}_concurrent_dup`;
    const concurrentPromises = Array.from({ length: 10 }, () => callApi({ action: 'claim', claimRequestId: concurrentReqId }));
    const concurrentResults = await Promise.all(concurrentPromises);
    const firstId = concurrentResults[0].couponId;
    const allMatch = concurrentResults.every(r => r.success && r.couponId === firstId);
    if (allMatch) {
      console.log(`  \x1b[32m✔ PASS\x1b[0m: All 10 parallel requests returned the exact same coupon: ${firstId}`);
      results.concurrency = 'PASS';
    } else {
      throw new Error(`Concurrency race condition detected! Not all responses matched.`);
    }

    console.log('\n\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[32m   ALL LIVE PRODUCTION INTEGRATION TESTS PASSED!    \x1b[0m');
    console.log('\x1b[32m====================================================\x1b[0m');

  } catch (err) {
    console.error(`\n\x1b[31m[FAILED]\x1b[0m ${err.message}`);
    process.exit(1);
  }
}

run();
