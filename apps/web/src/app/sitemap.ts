import type { MetadataRoute } from 'next';

import { getAllPublishedForSitemap } from '@/lib/api/public';
import { CONTENT_TYPE_ORDER, contentPath, sectionPath } from '@/lib/content-routes';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function absolute(path: string): string {
  return new URL(path, siteUrl).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absolute('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...CONTENT_TYPE_ORDER.map((type) => ({
      url: absolute(sectionPath(type)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  try {
    const items = await getAllPublishedForSitemap();

    return [
      ...staticRoutes,
      ...items.map((item) => ({
        url: absolute(contentPath(item.type, item.slug)),
        lastModified: item.publishedAt ? new Date(item.publishedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Sitemap tetap berguna walau API sedang tidak dapat dihubungi saat build.
    return staticRoutes;
  }
}
