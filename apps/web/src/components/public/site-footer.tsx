import Link from 'next/link';

import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink-900 text-ink-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
        <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/" className="transition hover:text-accent-400">
            Beranda
          </Link>
          {CONTENT_TYPE_ORDER.map((type) => (
            <Link
              key={type}
              href={sectionPath(type)}
              className="transition hover:text-accent-400"
            >
              {CONTENT_SECTIONS[type].title}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WebDakwah. Dibangun untuk kebaikan.</p>
          <p>Konten ditinjau admin sebelum terbit.</p>
        </div>
      </div>
    </footer>
  );
}
