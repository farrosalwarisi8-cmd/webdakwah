import type { ContentStatus } from '@webdakwah/shared';

export const STATUS_BADGE_STYLES: Record<ContentStatus, string> = {
  DRAFT: 'bg-ink-100 text-ink-700',
  PENDING_REVIEW: 'bg-warning/10 text-warning',
  PUBLISHED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
  ARCHIVED: 'bg-ink-200 text-ink-600',
};

/** Penulis hanya boleh menyunting draft atau konten yang ditolak. */
export function isAuthorEditable(status: ContentStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

export function isReadOnlyForAuthor(status: ContentStatus): boolean {
  return status === 'PENDING_REVIEW' || status === 'PUBLISHED' || status === 'ARCHIVED';
}
