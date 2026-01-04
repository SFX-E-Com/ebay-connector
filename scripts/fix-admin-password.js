/**
 * Fix Admin User Password Field
 *
 * This script fixes the admin user document in Firestore by renaming
 * the `passwordHash` field to `password` (the expected field name).
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'sharkyv0'
  });
}

const db = admin.firestore();

async function fixAdminPassword() {
  try {
    console.log('🔍 Searching for admin user...');

    // Find user with email
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('email', '==', 'admin@ebay-connector.local')
      .get();

    if (snapshot.empty) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log('✅ Found admin user:', userDoc.id);
    console.log('📋 Current fields:', Object.keys(userData));

    // Check if passwordHash exists
    if (!userData.passwordHash) {
      console.log('⚠️  No passwordHash field found');

      if (userData.password) {
        console.log('✅ Password field already exists - no fix needed');
      } else {
        console.log('❌ Neither password nor passwordHash field exists');
      }

      process.exit(0);
    }

    console.log('🔧 Fixing field name: passwordHash → password');

    // Update the document
    await userDoc.ref.update({
      password: userData.passwordHash,
      passwordHash: admin.firestore.FieldValue.delete()
    });

    console.log('✅ Successfully updated password field');

    // Verify the change
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();

    console.log('📋 Updated fields:', Object.keys(updatedData));
    console.log('✅ Verification: password field exists =', !!updatedData.password);
    console.log('✅ Verification: passwordHash field removed =', !updatedData.passwordHash);

    console.log('\n✨ Fix complete! You can now login with:');
    console.log('   Email: admin@ebay-connector.local');
    console.log('   Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminPassword();
