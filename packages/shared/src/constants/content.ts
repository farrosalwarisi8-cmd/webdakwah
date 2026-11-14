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
  REJECTED: 'Ditolak',
  ARCHIVED: 'Diarsipkan',
};

/** Jenis konten yang punya alur status sama. */
export const CONTENT_TYPES = ['ARTICLE', 'AUDIO', 'VIDEO', 'LINK'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

/** Jenis konten yang boleh punya "tautan terkait" (ContentLink). */
export const CONTENT_LINK_TYPES = ['ARTICLE', 'AUDIO', 'VIDEO'] as const;

export type ContentLinkType = (typeof CONTENT_LINK_TYPES)[number];
