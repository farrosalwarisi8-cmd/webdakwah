import type { PublicContentSummary } from '@webdakwah/shared';

export const BOOKMARKS_STORAGE_KEY = 'webdakwah:bookmarks';
export const BOOKMARKS_EVENT = 'webdakwah:bookmarks-changed';

export type BookmarkItem = PublicContentSummary;

export function toBookmarkItem(item: PublicContentSummary): BookmarkItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    mediaUrl: item.mediaUrl,
    publishedAt: item.publishedAt,
    author: item.author,
    categories: item.categories,
    tags: item.tags,
    speaker: item.speaker,
  };
}

export function readBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? '[]');

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is BookmarkItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        'id' in item &&
        'slug' in item &&
        'type' in item &&
        'title' in item,
    );
  } catch {
    return [];
  }
}

function writeBookmarks(items: BookmarkItem[]) {
  window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(BOOKMARKS_EVENT));
}

export function isBookmarked(id: string): boolean {
  return readBookmarks().some((item) => item.id === id);
}

/** Mengembalikan status tersimpan setelah perubahan. */
export function toggleBookmark(item: BookmarkItem): boolean {
  const items = readBookmarks();
  const exists = items.some((saved) => saved.id === item.id);
  const next = exists ? items.filter((saved) => saved.id !== item.id) : [item, ...items];

  writeBookmarks(next);

  return !exists;
}

export function removeBookmark(id: string) {
  writeBookmarks(readBookmarks().filter((item) => item.id !== id));
}
