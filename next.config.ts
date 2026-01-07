import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
  ],
};

export default nextConfig;
