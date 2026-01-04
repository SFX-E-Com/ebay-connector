import { beforeAll, afterAll } from 'vitest';

// Set environment variables for Firebase Emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.EBAY_SANDBOX = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.EBAY_CLIENT_ID = 'test-client-id';
process.env.EBAY_CLIENT_SECRET = 'test-client-secret';
process.env.EBAY_REDIRECT_URI = 'http://localhost:3000/api/ebay/callback';

beforeAll(() => {
  console.log('Integration tests starting with Firebase Emulator');
  console.log('Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
});

afterAll(() => {
  console.log('Integration tests completed');
});
