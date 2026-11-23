import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/akun', '/masuk', '/daftar', '/auth', '/lupa-sandi', '/atur-sandi'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
