'use client';

import { Bookmark, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BOOKMARKS_EVENT, readBookmarks, removeBookmark, type BookmarkItem } from '@/lib/bookmarks';

import { PublicContentCard } from './content-card';

export function SavedContentList() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readBookmarks());

    sync();
    setReady(true);
    window.addEventListener(BOOKMARKS_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!ready) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-52 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-100 text-accent-700">
          <Bookmark aria-hidden className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink-800">Belum ada kajian tersimpan.</p>
        <p className="mt-1 text-sm text-ink-500">
          Tekan tombol Simpan pada detail kajian untuk menyimpannya di perangkat ini.
        </p>
        <Link
          href="/cari"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Jelajah kajian
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col">
          <PublicContentCard item={item} />
          <button
            type="button"
            onClick={() => removeBookmark(item.id)}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-600 transition hover:border-danger/30 hover:text-danger"
          >
            <Trash2 aria-hidden className="size-3.5" />
            Hapus dari simpanan
          </button>
        </li>
      ))}
    </ul>
  );
}
