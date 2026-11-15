import type { ContentType } from '@webdakwah/shared';
import type { Metadata } from 'next';

import { getPublicContent } from './api/public';
import { CONTENT_SECTIONS, contentPath } from './content-routes';

/** Metadata halaman baca; bila konten tidak ada, jangan indeks halaman kosong. */
export async function contentMetadata(type: ContentType, slug: string): Promise<Metadata> {
  const section = CONTENT_SECTIONS[type];

  try {
    const content = await getPublicContent(slug);

    if (content.type !== type) {
      throw new Error('Jenis konten tidak cocok dengan URL.');
    }

    const description = content.excerpt ?? section.description;

    return {
      title: content.title,
      description,
      alternates: { canonical: contentPath(type, content.slug) },
      openGraph: {
        type: 'article',
        title: content.title,
        description,
        url: contentPath(type, content.slug),
        ...(content.publishedAt ? { publishedTime: content.publishedAt } : {}),
        ...(content.author.fullName ? { authors: [content.author.fullName] } : {}),
      },
    };
  } catch {
    return {
      title: section.title,
      robots: { index: false, follow: false },
    };
  }
}
