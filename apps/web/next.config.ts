import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Gambar isi konten dirender sebagai <img> dari HTML tersanitasi, jadi
  // remotePatterns untuk next/image tidak diperlukan.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
