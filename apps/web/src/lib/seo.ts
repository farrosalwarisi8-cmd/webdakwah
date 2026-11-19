import type { ContentType } from '@webdakwah/shared';
import type { Metadata } from 'next';

import { getPublicContent } from './api/public';
import { CONTENT_SECTIONS, contentPath } from './content-routes';

/** Objek JSON-LD terstruktur untuk halaman baca. */
function structuredData(
  type: ContentType,
  title: string,
  description: string,
  canonicalUrl: string,
  publishedAt: string | undefined,
  authorName: string | undefined,
  image: string | undefined,
  transcript: string | undefined,
) {
  const normalizedDate = publishedAt ? new Date(publishedAt).toISOString() : undefined;

  const base: Record<string, unknown> = {
    '@type': 'CreativeWork',
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
    datePublished: normalizedDate,
  };

  if (authorName) {
    base.author = { '@type': 'Person', name: authorName };
  }

  switch (type) {
    case 'ARTICLE': {
      const article: Record<string, unknown> = {
        '@type': 'Article',
        headline: title,
        description,
        URL: canonicalUrl,
        inLanguage: 'id-ID',
        isAccessibleForFree: true,
        datePublished: normalizedDate,
        ...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
        ...[image].filter(Boolean).map((img) => ({
          image: {
            '@type': 'ImageObject',
            url: img,
            width: 1200,
            height: 630,
          },
        })),
        ...[transcript]
          .filter(Boolean)
          .map((t) => ({ transcript: { '@type': 'Transcript', text: t } })),
        sameAs: [
          'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(canonicalUrl),
          'https://twitter.com/intent/tweet?url=' + encodeURIComponent(canonicalUrl),
        ],
      };
      return { '@context': 'https://schema.org', '@graph': [base, article] };
    }
    case 'AUDIO': {
      const audioObject: Record<string, unknown> = {
        '@type': 'AudioObject',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: 'id-ID',
        isAccessibleForFree: true,
        datePublished: normalizedDate,
        ...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
        ...[image].filter(Boolean).map((img) => ({
          image: {
            '@type': 'ImageObject',
            url: img,
            width: 1200,
            height: 630,
          },
        })),
        ...[transcript]
          .filter(Boolean)
          .map((t) => ({ transcript: { '@type': 'Transcript', text: t } })),
        audio: {
          '@type': 'AudioObject',
          contentUrl: canonicalUrl,
          encodingFormat: 'text/html',
          playbackUrl: canonicalUrl,
        } as unknown,
      };
      return { '@context': 'https://schema.org', '@graph': [base, audioObject] };
    }
    case 'VIDEO': {
      const videoObject: Record<string, unknown> = {
        '@type': 'VideoObject',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: 'id-ID',
        isAccessibleForFree: true,
        datePublished: normalizedDate,
        ...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
        ...[image].filter(Boolean).map((img) => ({
          image: {
            '@type': 'ImageObject',
            url: img,
            width: 1200,
            height: 630,
          },
        })),
        ...[transcript]
          .filter(Boolean)
          .map((t) => ({ transcript: { '@type': 'Transcript', text: t } })),
        contentUrl: canonicalUrl,
        encodingFormat: 'text/html',
        embedUrl: canonicalUrl,
      };
      return { '@context': 'https://schema.org', '@graph': [base, videoObject] };
    }
    default:
      return { '@context': 'https://schema.org', '@graph': [base] };
  }
}

/** Metadata halaman baca; bila konten tidak ada, jangan indeks halaman kosong. */
export async function contentMetadata(type: ContentType, slug: string): Promise<Metadata> {
  const section = CONTENT_SECTIONS[type];

  try {
    const content = await getPublicContent(slug);

    if (content.type !== type) {
      throw new Error('Jenis konten tidak cocok dengan URL.');
    }

    const description = content.excerpt ?? section.description;
    const canonicalUrl = contentPath(type, content.slug);
    const authorName = content.author.fullName ?? content.speaker?.name;
    const imageUrl: string = String((content.mediaUrl ?? section.imageUrl).trim());
    const transcript: string | undefined = content.transcript ?? undefined;

    const jsonLd = structuredData(
      type,
      content.title,
      description,
      canonicalUrl,
      content.publishedAt ?? undefined,
      authorName,
      imageUrl,
      transcript,
    );

    return {
      title: content.title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'article',
        title: content.title,
        description,
        url: canonicalUrl,
        ...(content.publishedAt ? { publishedTime: content.publishedAt } : {}),
        ...(content.author.fullName ? { authors: [content.author.fullName] } : {}),
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: content.title,
              },
            ]
          : [],
      },
      other: {
        'application/ld+json': JSON.stringify(jsonLd),
      },
    };
  } catch {
    return {
      title: section.title,
      robots: { index: false, follow: false },
    };
  }
}
