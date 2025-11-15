/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb', // 1GB max with Cloudflare R2
    },
  },
  // Optimize for Cloudflare Pages Edge Runtime
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js Image Optimization
  },
};

module.exports = nextConfig;
