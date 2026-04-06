import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
         protocol: 'https',
         hostname: '*.stellar.org',
      },
      {
         protocol: 'https',
         hostname: 'lh3.googleusercontent.com',
      },
      {
         protocol: 'https',
         hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  experimental: {
    // any experimental features needed for serverless
  }
};

export default nextConfig;
