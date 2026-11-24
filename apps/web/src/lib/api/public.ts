import {
  publicCategoryListSchema,
  publicContentDetailSchema,
  publicContentListSchema,
  publicHighlightsSchema,
  publicLatestSchema,
  publicLiveSchema,
  publicSpeakerListSchema,
  publicTagListSchema,
  type ContentType,
  type PublicContentDetail,
  type PublicContentList,
  type PublicHighlights,
  type PublicLatest,
  type PublicLive,
} from '@webdakwah/shared';
import { cache } from 'react';

import { PUBLIC_CONTENT_TAG } from '../cache-tags';
import {
  getSnapshotResponse,
  isSnapshotFallbackActive,
  snapshotGeneratedAt,
} from './public-snapshot';

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

async function requestParsed<T>(
  path: string,
  schema: Schema<T>,
  revalidateSeconds: number,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate: revalidateSeconds, tags: [PUBLIC_CONTENT_TAG] },
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

/**
 * Bila API mati saat build, pakai jawaban terakhir yang terekam di
 * `src/data/public-snapshot.json` supaya halaman publik tidak dibangun kosong.
 * Jawaban 4xx tidak pernah diganti cadangan: konten yang sudah dihapus atau
 * diarsipkan harus tetap hilang.
 */
function readSnapshotFallback<T>(path: string, schema: Schema<T>): T | null {
  if (!isSnapshotFallbackActive()) return null;

  const raw = getSnapshotResponse(path);

  if (raw === null) return null;

  const parsed = schema.safeParse(raw);

  return parsed.success ? parsed.data : null;
}

async function fetchParsed<T>(
  path: string,
  schema: Schema<T>,
  revalidateSeconds = REVALIDATE_SECONDS,
): Promise<T> {
  try {
    return await requestParsed(path, schema, revalidateSeconds);
  } catch (error) {
    if (error instanceof PublicApiError && error.status >= 400 && error.status < 500) {
      throw error;
    }

    const fallback = readSnapshotFallback(path, schema);

    if (!fallback) throw error;

    console.warn(
      `[public-api] API gagal untuk ${path}; memakai cadangan build` +
        ` (${snapshotGeneratedAt() ?? 'belum pernah dibuat'}).`,
    );

    return fallback;
  }
}

export async function getPublicList(type: ContentType, page: number): Promise<PublicContentList> {
  return fetchParsed(`/public/contents?type=${type}&page=${page}`, publicContentListSchema);
}

export async function getPublicListByFilter(
  filter: { category?: string; tag?: string; speaker?: string },
  page: number,
): Promise<PublicContentList> {
  const params = new URLSearchParams({ page: String(page) });
  if (filter.category) params.set('category', filter.category);
  if (filter.tag) params.set('tag', filter.tag);
  if (filter.speaker) params.set('speaker', filter.speaker);

  return fetchParsed(`/public/contents?${params.toString()}`, publicContentListSchema);
}

export async function getPublicCategories() {
  return fetchParsed('/categories', publicCategoryListSchema);
}

export async function getPublicTags() {
  return fetchParsed('/tags', publicTagListSchema);
}

export async function getPublicSpeakers() {
  return fetchParsed('/speakers', publicSpeakerListSchema);
}

export async function getPublicSearch(
  query: string,
  type: ContentType | null,
  page: number,
): Promise<PublicContentList> {
  const params = new URLSearchParams({ q: query, page: String(page) });

  if (type) {
    params.set('type', type);
  }

  return fetchParsed(`/public/search?${params.toString()}`, publicContentListSchema);
}

/** `cache` mencegah pengambilan ganda antara generateMetadata dan halaman. */
export const getPublicContent = cache(async (slug: string): Promise<PublicContentDetail> =>
  fetchParsed(`/public/contents/${encodeURIComponent(slug)}`, publicContentDetailSchema),
);

export const getHomeHighlights = cache(async (): Promise<PublicHighlights> =>
  fetchParsed('/public/highlights', publicHighlightsSchema),
);

export const getLatestContent = cache(async (limit = 8): Promise<PublicLatest> =>
  fetchParsed(`/public/latest?limit=${limit}`, publicLatestSchema),
);

/**
 * Informasi siaran langsung. Revalidasi pendek supaya perubahan jadwal dan
 * status cepat terlihat, tanpa membebani API setiap kunjungan.
 */
export const getPublicLive = cache(async (): Promise<PublicLive> =>
  fetchParsed('/public/live', publicLiveSchema, 30),
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
