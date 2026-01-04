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
  console.log('Checking ebay_accounts collection...');
  
  const snapshot = await db.collection('ebay_accounts').get();
  
  console.log('Found', snapshot.size, 'accounts\n');
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log('Account ID:', doc.id);
    console.log('  friendlyName:', data.friendlyName);
    console.log('  environment:', data.environment);
    console.log('  status:', data.status);
    console.log('');
  });
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
