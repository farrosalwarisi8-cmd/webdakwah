import {
  publicContentDetailSchema,
  publicContentListSchema,
  publicHighlightsSchema,
  type ContentType,
  type PublicContentDetail,
  type PublicContentList,
  type PublicHighlights,
} from '@webdakwah/shared';
import { cache } from 'react';

import { PUBLIC_CONTENT_TAG } from '../cache-tags';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const REVALIDATE_SECONDS = 60;
const SITEMAP_MAX_PAGES = 20;

export class PublicApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PublicApiError';
  }
}

/** Cukup struktural: web tidak perlu mengimpor zod hanya untuk tipe parser. */
interface Schema<T> {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false };
}

async function fetchParsed<T>(path: string, schema: Schema<T>): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_CONTENT_TAG] },
    });
  } catch {
    throw new PublicApiError(503, 'Server konten sedang tidak dapat dihubungi.');
  }

  if (!response.ok) {
    throw new PublicApiError(
      response.status,
      response.status === 404
        ? 'Konten tidak ditemukan.'
        : 'Konten belum bisa dimuat. Coba lagi beberapa saat.',
    );
  }

  const parsed = schema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    throw new PublicApiError(502, 'Format konten dari server tidak dikenali.');
  }

  return parsed.data;
}

export async function getPublicList(type: ContentType, page: number): Promise<PublicContentList> {
  return fetchParsed(`/public/contents?type=${type}&page=${page}`, publicContentListSchema);
}

/** `cache` mencegah pengambilan ganda antara generateMetadata dan halaman. */
export const getPublicContent = cache(async (slug: string): Promise<PublicContentDetail> =>
  fetchParsed(`/public/contents/${encodeURIComponent(slug)}`, publicContentDetailSchema),
);

export const getHomeHighlights = cache(async (): Promise<PublicHighlights> =>
  fetchParsed('/public/highlights', publicHighlightsSchema),
);

/** Semua konten terbit untuk sitemap, dibatasi agar build tidak menggantung. */
export async function getAllPublishedForSitemap(): Promise<PublicContentList['items']> {
  const items: PublicContentList['items'] = [];
  let page = 1;

  while (page <= SITEMAP_MAX_PAGES) {
    const result = await fetchParsed(
      `/public/contents?page=${page}&pageSize=50`,
      publicContentListSchema,
    ).catch(() => null);

    if (!result) {
      break;
    }

    items.push(...result.items);

    if (page >= result.totalPages) {
      break;
    }

    page += 1;
  }

  return items;
}
