import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pdfjs-dist', 'canvas'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger PDF uploads
    },
  },
};

export default nextConfig;
