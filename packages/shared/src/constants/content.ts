/**
 * Alur status konten:
 * DRAFT -> PENDING_REVIEW -> PUBLISHED
 * PENDING_REVIEW -> REJECTED (dengan catatan) -> DRAFT
 * PUBLISHED -> ARCHIVED (oleh Admin)
 */
export const CONTENT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Menunggu Review',
  PUBLISHED: 'Terbit',
  REJECTED: 'Perlu Perbaikan',
  ARCHIVED: 'Disembunyikan',
};

/** Jenis konten yang punya alur status sama. */
export const CONTENT_TYPES = ['ARTICLE', 'AUDIO', 'VIDEO', 'LINK'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Artikel',
  AUDIO: 'Audio Kajian',
  VIDEO: 'Video',
  LINK: 'Tautan Rujukan',
};

/** Jenis konten yang boleh punya "tautan terkait" (ContentLink). */
export const CONTENT_LINK_TYPES = ['ARTICLE', 'AUDIO', 'VIDEO'] as const;

/** Batas jumlah tautan terkait per konten. */
export const MAX_CONTENT_LINKS_PER_CONTENT = 10;

/** Panjang maksimal judul tautan terkait. */
export const CONTENT_LINK_TITLE_MAX_LENGTH = 200;

export type ContentLinkType = (typeof CONTENT_LINK_TYPES)[number];
