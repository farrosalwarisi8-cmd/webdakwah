import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-accent-400">
                <BookOpen aria-hidden className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">WebDakwah</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Ruang kajian yang tenang: artikel, audio, video, dan rujukan yang ditinjau sebelum
              terbit.
            </p>
          </div>

          <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-5 gap-y-0 text-sm">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-white/65 transition hover:text-accent-300"
            >
              Beranda
            </Link>
            {CONTENT_TYPE_ORDER.map((type) => (
              <Link
                key={type}
                href={sectionPath(type)}
                className="inline-flex min-h-11 items-center text-white/65 transition hover:text-accent-300"
              >
                {CONTENT_SECTIONS[type].title}
              </Link>
            ))}
            <Link
              href="/siaran"
              className="inline-flex min-h-11 items-center text-white/65 transition hover:text-accent-300"
            >
              Siaran
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WebDakwah. Dibangun untuk kebaikan.</p>
          <p>Setiap konten ditinjau admin sebelum terbit.</p>
        </div>
      </div>
    </footer>
  );
}
