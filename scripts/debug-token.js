/**
 * Debug Token Script - Check token status and expiration
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize with explicit project
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'sharkyv0'
});

const db = admin.firestore(app);
db.settings({ databaseId: 'ebay-connector' });

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     eBay Token Debug');
  console.log('═══════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('ebay_accounts').get();

  console.log('Found', snapshot.size, 'account(s)\n');

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const now = new Date();

    // Parse expiresAt
    let expiresAt = null;
    let isExpired = true;
    let expiresIn = 'N/A';

    if (data.expiresAt) {
      if (data.expiresAt._seconds) {
        expiresAt = new Date(data.expiresAt._seconds * 1000);
      } else if (data.expiresAt.toDate) {
        expiresAt = data.expiresAt.toDate();
      } else {
        expiresAt = new Date(data.expiresAt);
      }

      isExpired = expiresAt < now;
      const diffMs = expiresAt - now;
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins > 0) {
        expiresIn = `${diffMins} minutes`;
      } else {
        expiresIn = `EXPIRED ${Math.abs(diffMins)} minutes ago`;
      }
    }

    console.log('───────────────────────────────────────────────────────────');
    console.log('Account ID:', doc.id);
    console.log('───────────────────────────────────────────────────────────');
    console.log('  friendlyName:', data.friendlyName || 'N/A');
    console.log('  ebayUserId:', data.ebayUserId || 'N/A');
    console.log('  ebayUsername:', data.ebayUsername || 'N/A');
    console.log('  environment:', data.environment || 'N/A');
    console.log('  status:', data.status || 'N/A');
    console.log('');
    console.log('  TOKEN STATUS:');
    console.log('  ─────────────');
    console.log('  hasAccessToken:', !!data.accessToken);
    console.log('  accessToken (first 20):', data.accessToken ? data.accessToken.substring(0, 20) + '...' : 'MISSING!');
    console.log('  hasRefreshToken:', !!data.refreshToken);
    console.log('  tokenType:', data.tokenType || 'N/A');
    console.log('');
    console.log('  EXPIRATION:');
    console.log('  ───────────');
    console.log('  expiresAt:', expiresAt ? expiresAt.toISOString() : 'NOT SET');
    console.log('  isExpired:', isExpired ? '⚠️  YES - TOKEN EXPIRED!' : '✅ No');
    console.log('  expiresIn:', expiresIn);
    console.log('  currentTime:', now.toISOString());
    console.log('');
    console.log('  SCOPES:');
    console.log('  ───────');
    console.log('  userSelectedScopes:', JSON.stringify(data.userSelectedScopes || []));
    console.log('  grantedScopes:', data.scopes ? data.scopes.length + ' scopes' : 'NONE');
    if (data.scopes && data.scopes.length > 0) {
      data.scopes.slice(0, 5).forEach(s => console.log('    -', s));
      if (data.scopes.length > 5) {
        console.log('    ... and', data.scopes.length - 5, 'more');
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');

  // Summary
  const expiredAccounts = snapshot.docs.filter(doc => {
    const data = doc.data();
    if (!data.expiresAt) return true;
    const expiresAt = data.expiresAt._seconds
      ? new Date(data.expiresAt._seconds * 1000)
      : new Date(data.expiresAt);
    return expiresAt < new Date();
  });

  if (expiredAccounts.length > 0) {
    console.log('\n⚠️  WARNING: ' + expiredAccounts.length + ' account(s) have EXPIRED tokens!');
    console.log('   This is likely the cause of 401 Unauthorized errors.');
    console.log('   Solution: Re-authorize the account via /ebay-connections');
  } else {
    console.log('\n✅ All tokens are valid.');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
