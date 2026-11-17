import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-surface-soft/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-accent-500 text-ink-950">
            <BookOpen aria-hidden className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm text-ink-600 transition hover:text-brand-700">
            Beranda
          </Link>
          {CONTENT_TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={sectionPath(type)}
              className="text-sm text-ink-600 transition hover:text-brand-700"
            >
              {CONTENT_SECTIONS[type].title}
            </Link>
          ))}
          <Link href="/siaran" className="text-sm text-ink-600 transition hover:text-brand-700">
            Siaran
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cari"
            aria-label="Cari konten"
            className="grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-accent-300 hover:text-accent-700"
          >
            <Search aria-hidden className="size-4" />
          </Link>
          <Link
            href="/masuk"
            className="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
