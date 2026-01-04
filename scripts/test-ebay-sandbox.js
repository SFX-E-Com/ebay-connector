/**
 * eBay Sandbox API Test Script
 *
 * Tests various eBay API endpoints using the connected sandbox account
 */

const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');
const fs = require('fs');

// Configuration
const SERVICE_URL = process.env.SERVICE_URL || 'https://ebay-connector-187959688255.europe-west1.run.app';
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'sharkyv0';
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ebay-connector';

// Initialize Firebase
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId
  });
}

const db = getFirestore(databaseId);

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${SERVICE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Get or create API token
async function getApiToken() {
  console.log('🔑 Getting API token...');

  // Get admin user
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('role', '==', 'SUPER_ADMIN').limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('No admin user found');
  }

  const adminUser = userSnapshot.docs[0].data();
  console.log(`   Found admin user: ${adminUser.email}`);

  // Check for existing token
  const tokensRef = db.collection('api_tokens');
  const tokenSnapshot = await tokensRef
    .where('userId', '==', adminUser.id)
    .where('name', '==', 'Test Script Token')
    .limit(1)
    .get();

  if (!tokenSnapshot.empty) {
    const existingToken = tokenSnapshot.docs[0].data();
    console.log('   Using existing test token');
    return existingToken.token;
  }

  // Create new token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenId = crypto.randomBytes(10).toString('hex');

  await tokensRef.doc(tokenId).set({
    id: tokenId,
    userId: adminUser.id,
    name: 'Test Script Token',
    token: token,
    endpoints: ['*'], // All endpoints
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('   Created new test token');
  return token;
}

// Get connected eBay account
async function getEbayAccount() {
  console.log('📦 Getting connected eBay account...');

  const accountsRef = db.collection('ebay_accounts');
  const snapshot = await accountsRef.where('status', '==', 'active').limit(1).get();

  if (snapshot.empty) {
    throw new Error('No connected eBay account found');
  }

  const account = snapshot.docs[0].data();
  console.log(`   Found account: ${account.ebayUserId || account.id}`);
  return account;
}

// Test functions
async function testOrders(accountId, token) {
  console.log('\n📋 Testing Orders API...');

  const result = await apiCall(`/api/ebay/${accountId}/orders?limit=5`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Orders: ${result.data.orders?.length || 0} found`);
    if (result.data.orders?.length > 0) {
      console.log(`   First order ID: ${result.data.orders[0].orderId}`);
    }
  } else {
    console.log(`   ❌ Orders failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testInventory(accountId, token) {
  console.log('\n📦 Testing Inventory API...');

  const result = await apiCall(`/api/ebay/${accountId}/inventory?limit=5`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Inventory items: ${result.data.inventoryItems?.length || 0} found`);
  } else {
    console.log(`   ❌ Inventory failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testOffers(accountId, token) {
  console.log('\n🏷️ Testing Offers API...');

  const result = await apiCall(`/api/ebay/${accountId}/offers?limit=5`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Offers: ${result.data.offers?.length || 0} found`);
  } else {
    console.log(`   ❌ Offers failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testTradingApiStatus(accountId, token) {
  console.log('\n🔧 Testing Trading API Status...');

  const result = await apiCall(`/api/ebay/${accountId}/trading/status`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Trading API connected`);
    console.log(`   User ID: ${result.data.userId || 'N/A'}`);
    console.log(`   Site: ${result.data.site || 'N/A'}`);
  } else {
    console.log(`   ❌ Trading API failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testPolicies(accountId, token) {
  console.log('\n📜 Testing Policies API...');

  const result = await apiCall(`/api/ebay/${accountId}/policies`, 'GET', null, token);

  if (result.ok) {
    const policies = result.data;
    console.log(`   ✅ Fulfillment policies: ${policies.fulfillmentPolicies?.length || 0}`);
    console.log(`   ✅ Payment policies: ${policies.paymentPolicies?.length || 0}`);
    console.log(`   ✅ Return policies: ${policies.returnPolicies?.length || 0}`);
  } else {
    console.log(`   ❌ Policies failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testLocations(accountId, token) {
  console.log('\n📍 Testing Locations API...');

  const result = await apiCall(`/api/ebay/${accountId}/locations`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Locations: ${result.data.locations?.length || 0} found`);
  } else {
    console.log(`   ❌ Locations failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

async function testAccountScopes(accountId, token) {
  console.log('\n🔐 Testing Account Scopes...');

  const result = await apiCall(`/api/ebay/${accountId}/scopes`, 'GET', null, token);

  if (result.ok) {
    console.log(`   ✅ Scopes: ${result.data.scopes?.length || 0} configured`);
    if (result.data.scopes?.length > 0) {
      result.data.scopes.slice(0, 3).forEach(scope => {
        console.log(`      - ${scope}`);
      });
      if (result.data.scopes.length > 3) {
        console.log(`      ... and ${result.data.scopes.length - 3} more`);
      }
    }
  } else {
    console.log(`   ❌ Scopes failed: ${result.data.message || result.data.error}`);
  }

  return result;
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     eBay Sandbox API Test Suite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nService URL: ${SERVICE_URL}`);
  console.log(`Database: ${databaseId}`);
  console.log('');

  try {
    // Get API token and eBay account
    const token = await getApiToken();
    const account = await getEbayAccount();
    const accountId = account.id;

    console.log('\n───────────────────────────────────────────────────────────');
    console.log('  Running API Tests');
    console.log('───────────────────────────────────────────────────────────');

    // Run all tests
    const results = {
      scopes: await testAccountScopes(accountId, token),
      tradingStatus: await testTradingApiStatus(accountId, token),
      orders: await testOrders(accountId, token),
      inventory: await testInventory(accountId, token),
      offers: await testOffers(accountId, token),
      policies: await testPolicies(accountId, token),
      locations: await testLocations(accountId, token),
    };

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Summary');
    console.log('═══════════════════════════════════════════════════════════');

    let passed = 0;
    let failed = 0;

    Object.entries(results).forEach(([name, result]) => {
      const status = result.ok ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${result.ok ? 'PASSED' : 'FAILED'}`);
      if (result.ok) passed++;
      else failed++;
    });

    console.log('───────────────────────────────────────────────────────────');
    console.log(`  Total: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
