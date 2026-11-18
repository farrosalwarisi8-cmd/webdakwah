import type { PublicContentList } from '@webdakwah/shared';
import { ArrowLeft, ArrowRight, Compass, Tags } from 'lucide-react';
import Link from 'next/link';

import { PublicContentCard } from './content-card';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function TaxonomyListPage({
  title,
  description,
  list,
  page,
  basePath,
}: {
  title: string;
  description: string;
  list: PublicContentList;
  page: number;
  basePath: string;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-ink-200/70 bg-surface-soft p-6 sm:p-8">
          <div
            aria-hidden
            className="pattern-islamic-ink pointer-events-none absolute inset-0 opacity-70"
          />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Tags aria-hidden className="size-6" />
            </span>
            <p className="mt-5 text-[10px] font-semibold tracking-[0.2em] text-brand-600 uppercase">
              Telusuri topik
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              {description}
            </p>
            {list.total > 0 ? (
              <p className="mt-4 inline-flex items-center rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600">
                {list.total} konten terbit
              </p>
            ) : null}
          </div>
        </section>

        {list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-surface-soft p-8 text-center sm:p-12">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Compass aria-hidden className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-ink-800">
              Belum ada konten untuk topik ini.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-600">
              Konten yang sudah ditinjau admin akan tampil di sini.
            </p>
            <Link
              href="/cari"
              className="btn-press mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              <Compass aria-hidden className="size-4" />
              Telusuri topik lain
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-8 text-xs text-ink-600">
              Menampilkan {list.items.length} dari {list.total} konten
            </p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((item) => (
                <li key={item.id}>
                  <PublicContentCard item={item} />
                </li>
              ))}
            </ul>
            {list.totalPages > 1 ? (
              <nav
                aria-label="Navigasi halaman"
                className="mt-10 flex items-center justify-between gap-3"
              >
                {page > 1 ? (
                  <Link
                    href={`${basePath}?page=${page - 1}`}
                    className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <ArrowLeft aria-hidden className="size-4" />
                    Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-ink-600">
                  Halaman {page} dari {list.totalPages}
                </span>
                {page < list.totalPages ? (
                  <Link
                    href={`${basePath}?page=${page + 1}`}
                    className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    Berikutnya
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
