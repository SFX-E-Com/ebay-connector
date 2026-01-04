/**
 * Upgrade Admin User to Super Admin
 *
 * This script upgrades the admin user from ADMIN to SUPER_ADMIN role.
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

async function upgradeToSuperAdmin() {
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
    console.log('📋 Current role:', userData.role);

    if (userData.role === 'SUPER_ADMIN') {
      console.log('✅ User is already SUPER_ADMIN - no upgrade needed');
      process.exit(0);
    }

    console.log('🔧 Upgrading role: ADMIN → SUPER_ADMIN');

    // Update the role
    await userDoc.ref.update({
      role: 'SUPER_ADMIN',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Successfully upgraded to SUPER_ADMIN');

    // Verify the change
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();

    console.log('✅ Verification: role =', updatedData.role);

    console.log('\n✨ Upgrade complete! You now have full access to:');
    console.log('   - User management (/users)');
    console.log('   - Debug logs (/api/debug/logs)');
    console.log('   - All admin features');
    console.log('\n⚠️  Note: You may need to logout and login again for changes to take effect.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  }
}

// Run the upgrade
upgradeToSuperAdmin();
