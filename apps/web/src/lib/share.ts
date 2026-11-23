import type { ContentType } from '@webdakwah/shared';

import { contentPath } from './content-routes';

/** Jenis konten yang punya tombol bagikan (rujukan eksternal tidak). */
export const SHAREABLE_TYPES: readonly ContentType[] = ['ARTICLE', 'AUDIO', 'VIDEO'];

export const FALLBACK_SITE_URL = 'http://localhost:3000';

export function isShareable(type: ContentType): boolean {
  return SHAREABLE_TYPES.includes(type);
}

/**
 * URL kanonik konten, absolut terhadap `NEXT_PUBLIC_SITE_URL`. Bila URL situs
 * tidak sah, kembalikan path relatif agar tombol bagikan tetap menyalin sesuatu
 * yang benar, bukan alamat setengah jadi.
 */
export function canonicalContentUrl(
  type: ContentType,
  slug: string,
  siteUrl: string | undefined,
): string {
  const path = contentPath(type, slug);
  const base = siteUrl?.trim();

  if (!base) {
    return new URL(path, FALLBACK_SITE_URL).toString();
  }

  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

/** Tautan bagikan WhatsApp; judul dan URL dienkode sebagai satu pesan. */
export function whatsappShareUrl(title: string, url: string): string {
  const message = `${title.trim()}\n${url}`.trim();

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export interface SharePayload {
  /** Judul untuk Web Share API dan pesan WhatsApp. */
  title: string;
  /** URL kanonik yang dibagikan atau disalin. */
  url: string;
  /** Cadangan bila Web Share API tidak tersedia. */
  whatsappUrl: string;
}

export function buildSharePayload(title: string, url: string): SharePayload {
  const cleanTitle = title.trim() || 'WebDakwah';

  return { title: cleanTitle, url, whatsappUrl: whatsappShareUrl(cleanTitle, url) };
}
