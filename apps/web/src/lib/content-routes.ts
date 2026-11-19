import type { ContentType } from '@webdakwah/shared';

interface ContentSection {
  segment: string;
  title: string;
  description: string;
  /** Gambar penutup untuk metadata OG / JSON-LD kalau konten tidak punya media. */
  imageUrl: string;
}

export const CONTENT_SECTIONS: Record<ContentType, ContentSection> = {
  ARTICLE: {
    segment: 'artikel',
    title: 'Artikel',
    description:
      'Tulisan ringkas dengan dalil yang jelas, disusun untuk dibaca dalam hitungan menit.',
    imageUrl: '/images/og-article.jpg',
  },
  AUDIO: {
    segment: 'audio',
    title: 'Audio Kajian',
    description: 'Rekaman kajian pilihan yang bisa disimak saat perjalanan atau di sela pekerjaan.',
    imageUrl: '/images/og-audio.jpg',
  },
  VIDEO: {
    segment: 'video',
    title: 'Video Dakwah',
    description: 'Video pendek yang padat, cocok dibagikan ke keluarga dan kerabat.',
    imageUrl: '/images/og-video.jpg',
  },
  LINK: {
    segment: 'rujukan',
    title: 'Tautan Rujukan',
    description: 'Tautan ke sumber terpercaya, dikurasi agar tidak tersesat di lautan informasi.',
    imageUrl: '/images/og-link.jpg',
  },
};

export const CONTENT_TYPE_ORDER: ContentType[] = ['ARTICLE', 'AUDIO', 'VIDEO', 'LINK'];

export function sectionPath(type: ContentType): string {
  return `/${CONTENT_SECTIONS[type].segment}`;
}

export function contentPath(type: ContentType, slug: string): string {
  return `${sectionPath(type)}/${encodeURIComponent(slug)}`;
}

/** Parameter halaman dari URL; nilai aneh diperlakukan sebagai halaman 1. */
export function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? '1', 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}
