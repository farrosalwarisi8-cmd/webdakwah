import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Gambar isi konten dirender sebagai <img> dari HTML tersanitasi, jadi
  // remotePatterns untuk next/image tidak diperlukan.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          // Service worker harus selalu diperiksa ulang agar versi cache baru cepat aktif.
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      },
    ];
  },
};

export default nextConfig;
