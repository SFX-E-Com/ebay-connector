/**
 * Create Admin User in Firestore
 *
 * Creates an admin user in the ebay-connector database
 */

const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'sharkyv0';
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId
  });
}

const db = getFirestore(databaseId);

async function createAdminUser() {
  try {
    console.log(`🔍 Connecting to Firestore...`);
    console.log(`   Project: ${projectId}`);
    console.log(`   Database: ${databaseId}`);

    const email = 'admin@ebay-connector.local';
    const password = 'Admin123!';

    // Check if admin user already exists
    console.log('\n🔍 Checking if admin user exists...');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', email);
      console.log('\n   Use this to reset password if needed:');
      console.log('   npm run script:fix-admin-password');
      process.exit(0);
    }

    console.log('✅ No existing admin user found');

    // Generate password hash
    console.log('\n🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const userId = generateId();
    const now = new Date();

    const adminUser = {
      id: userId,
      email: email,
      password: passwordHash,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      createdAt: now,
      updatedAt: now
    };

    await usersRef.doc(userId).set(adminUser);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🌐 Access the dashboard at: http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the script
createAdminUser();
