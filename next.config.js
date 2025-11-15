/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb', // 1GB max with Cloudflare R2
    },
  },
};

module.exports = nextConfig;
