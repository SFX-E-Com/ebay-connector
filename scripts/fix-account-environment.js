/**
 * Fix existing eBay accounts without environment field
 * Sets environment to 'sandbox' for all accounts that don't have it
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  // Initialize Firebase Admin
  const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ebay-connector';
  
  initializeApp({
    credential: cert(require('../service-account.json')),
  });

  const db = getFirestore(databaseId);
  
  console.log(`Using Firestore database: ${databaseId}`);
  
  // Get all eBay accounts
  const snapshot = await db.collection('ebay_accounts').get();
  
  if (snapshot.empty) {
    console.log('No eBay accounts found.');
    return;
  }

  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    if (!data.environment) {
      console.log(`Updating account ${doc.id} (${data.friendlyName || data.ebayUserId})...`);
      
      await doc.ref.update({
        environment: 'sandbox'
      });
      
      updated++;
      console.log(`  -> Set environment to 'sandbox'`);
    } else {
      console.log(`Account ${doc.id} already has environment: ${data.environment}`);
    }
  }

  console.log(`\nDone! Updated ${updated} account(s).`);
}

main().catch(console.error);
