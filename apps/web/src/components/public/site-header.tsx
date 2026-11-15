import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-ink-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-brand-50">
            <BookOpen aria-hidden className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
        </Link>

        <nav aria-label="Kategori konten" className="hidden items-center gap-6 sm:flex">
          {CONTENT_TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={sectionPath(type)}
              className="text-sm text-ink-600 transition hover:text-brand-700"
            >
              {CONTENT_SECTIONS[type].title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cari"
            aria-label="Cari konten"
            className="grid size-9 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Search aria-hidden className="size-4" />
          </Link>
          <Link
            href="/masuk"
            className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Masuk
          </Link>
        </div>
      </div>

      <nav
        aria-label="Kategori konten"
        className="overflow-x-auto border-t border-ink-200/70 sm:hidden"
      >
        <div className="flex gap-1 px-3 py-2">
          {CONTENT_TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={sectionPath(type)}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-ink-600 transition hover:bg-white hover:text-brand-700"
            >
              {CONTENT_SECTIONS[type].title}
            </Link>
          ))}
          <Link
            href="/cari"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-600 transition hover:bg-white hover:text-brand-700"
          >
            <Search aria-hidden className="size-3.5" />
            Cari
          </Link>
        </div>
      </nav>
    </header>
  );
}
