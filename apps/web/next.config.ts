import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Gambar dari R2 akan ditambahkan pada fase upload.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
