import type { NextConfig } from 'next';

import { securityHeaders, staticContentSecurityPolicyHeaders } from './src/lib/security/headers';

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
        // CSP rute privat (nonce) dipasang per permintaan di src/proxy.ts, karena
        // kebijakan nonce membuat HTML harus dinamis.
        source: '/:path*',
        headers: securityHeaders(),
      },
      // Rute publik dirender statis/ISR: CSP-nya tanpa nonce dan ikut tersimpan
      // di cache HTML, sehingga tetap terkirim saat permintaan dilayani CDN.
      // Pola negatif dipakai agar halaman 404 pada path apa pun ikut mendapat CSP.
      {
        source: '/:path((?!dashboard|masuk|daftar|akun|auth|lupa-sandi|atur-sandi|api).*)',
        headers: staticContentSecurityPolicyHeaders(),
      },
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
