import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdf-parse'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger PDF uploads
    },
  },
};

export default nextConfig;
