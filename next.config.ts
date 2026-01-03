import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Firebase Admin SDK uses native Node.js modules that can't be bundled
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
  ],
};

export default nextConfig;
