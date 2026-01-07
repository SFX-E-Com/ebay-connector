import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Cloud Run deployment
  output: 'standalone',

  // Firebase Admin SDK uses native Node.js modules that can't be bundled
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
  ],
  
  // Rewrite OAuth callback URLs to match eBay Developer Portal configuration
  async rewrites() {
    return [
      {
        source: '/oauth/accepted',
        destination: '/api/ebay/oauth/callback',
      },
      {
        source: '/oauth/declined', 
        destination: '/api/ebay/oauth/declined',
      },
    ];
  },
};

export default nextConfig;
