'use client';

import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

const NAV_LABELS = {
  ARTICLE: 'Artikel',
  AUDIO: 'Audio',
  VIDEO: 'Video',
  LINK: 'Rujukan',
} as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-surface-soft/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface-soft/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-h-11 shrink-0 items-center gap-2.5"
          aria-label="WebDakwah, beranda"
        >
          <span className="relative grid size-10 place-items-center rounded-2xl bg-brand-900 text-accent-400 shadow-soft transition group-hover:bg-brand-800">
            <BookOpen aria-hidden className="size-5" />
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface-soft bg-accent-500" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-semibold tracking-tight text-ink-900">WebDakwah</span>
            <span className="mt-1 hidden text-[9px] font-semibold tracking-[0.2em] text-ink-600 uppercase sm:block">
              Kajian terkurasi
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 md:flex">
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`rounded-full px-2.5 py-2 text-sm font-medium transition lg:px-3 ${
              pathname === '/'
                ? 'bg-brand-100 text-brand-900'
                : 'text-ink-600 hover:bg-white hover:text-brand-800'
            }`}
          >
            Beranda
          </Link>
          {CONTENT_TYPE_ORDER.map((type) => {
            const href = sectionPath(type);
            const active = isActive(pathname, href);

            return (
              <Link
                key={type}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-2.5 py-2 text-sm font-medium transition lg:px-3 ${
                  active
                    ? 'bg-brand-100 text-brand-900'
                    : 'text-ink-600 hover:bg-white hover:text-brand-800'
                }`}
              >
                {NAV_LABELS[type]}
              </Link>
            );
          })}
          <Link
            href="/siaran"
            aria-current={isActive(pathname, '/siaran') ? 'page' : undefined}
            className={`rounded-full px-2.5 py-2 text-sm font-medium transition lg:px-3 ${
              isActive(pathname, '/siaran')
                ? 'bg-brand-100 text-brand-900'
                : 'text-ink-600 hover:bg-white hover:text-brand-800'
            }`}
          >
            Siaran
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/cari"
            aria-label="Cari konten"
            className="btn-press grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-800"
          >
            <Search aria-hidden className="size-4" />
          </Link>
          <Link
            href="/daftar"
            className="hidden min-h-11 items-center px-2 text-sm font-medium text-ink-600 transition hover:text-brand-800 sm:inline-flex"
          >
            Daftar
          </Link>
          <Link
            href="/masuk"
            className="btn-press inline-flex min-h-11 items-center rounded-full border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-800 sm:px-5"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
