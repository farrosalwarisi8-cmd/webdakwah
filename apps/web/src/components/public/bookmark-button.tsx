'use client';

import type { PublicContentSummary } from '@webdakwah/shared';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BOOKMARKS_EVENT, isBookmarked, toBookmarkItem, toggleBookmark } from '@/lib/bookmarks';

export function BookmarkButton({ item }: { item: PublicContentSummary }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isBookmarked(item.id));

    sync();
    setReady(true);
    window.addEventListener(BOOKMARKS_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [item.id]);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => setSaved(toggleBookmark(toBookmarkItem(item)))}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        saved
          ? 'border-brand-300 bg-brand-50 text-brand-800'
          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {saved ? (
        <BookmarkCheck aria-hidden className="size-4" />
      ) : (
        <Bookmark aria-hidden className="size-4" />
      )}
      {ready && saved ? 'Tersimpan' : 'Simpan'}
    </button>
  );
}
