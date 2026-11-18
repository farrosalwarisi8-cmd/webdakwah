import type { ContentType } from '@webdakwah/shared';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PublicContentCard } from '@/components/public/content-card';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { PublicApiError, getPublicSearch } from '@/lib/api/public';
import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER } from '@/lib/content-routes';

export const metadata: Metadata = {
  title: 'Cari Konten',
  description: 'Cari artikel, audio, video, dan rujukan yang sudah terbit di WebDakwah.',
  robots: { index: false, follow: true },
};

function readValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

function searchHref(query: string, type: ContentType | null, page = 1): string {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (type) {
    params.set('type', type);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const suffix = params.toString();

  return suffix ? `/cari?${suffix}` : '/cari';
}

function Pagination({
  query,
  type,
  page,
  totalPages,
}: {
  query: string;
  type: ContentType | null;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi hasil pencarian"
      className="mt-10 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link
          href={searchHref(query, type, page - 1)}
          className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          ← Sebelumnya
        </Link>
      ) : (
        <span aria-hidden />
      )}

      <span className="text-xs text-ink-600">
        Halaman {page} dari {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={searchHref(query, type, page + 1)}
          className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          Berikutnya →
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}

export default async function CariPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = readValue(params.q);
  const rawType = readValue(params.type);
  const type = CONTENT_TYPE_ORDER.find((item) => item === rawType) ?? null;
  const page = Math.max(1, Number.parseInt(readValue(params.page) || '1', 10) || 1);

  const tooShort = query.length > 0 && query.length < 2;
  const tooLong = query.length > 100;

  let list = null;
  let error: string | null = null;

  if (query.length >= 2 && !tooLong) {
    try {
      list = await getPublicSearch(query, type, page);
    } catch (caught) {
      error =
        caught instanceof PublicApiError
          ? caught.message
          : 'Pencarian belum bisa dimuat. Coba lagi beberapa saat.';
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Remah roti" className="text-xs text-ink-600">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">Cari</span>
        </nav>

        <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-ink-200/70 bg-surface-soft p-6 sm:p-8">
          <div aria-hidden className="pattern-islamic-ink pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-brand-600 uppercase">
              Pencarian
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Cari Konten
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              Telusuri judul, ringkasan, dan isi konten yang sudah terbit. Masukkan minimal dua
              karakter.
            </p>

        <form action="/cari" method="get" className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="q" className="sr-only">
            Kata kunci
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={100}
              placeholder="Misalnya: sabar, ilmu, kajian…"
              className="min-h-12 w-full rounded-full border border-ink-200 bg-white py-2.5 pr-4 pl-11 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none"
            />
          </div>
          {type ? <input type="hidden" name="type" value={type} /> : null}
          <button
            type="submit"
            className="btn-press inline-flex min-h-12 items-center justify-center rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Cari
          </button>
        </form>

        <nav aria-label="Filter jenis konten" className="mt-4 flex flex-wrap gap-2">
          <Link
            href={searchHref(query, null)}
            className={
              type === null
                ? 'inline-flex min-h-10 items-center rounded-full bg-brand-900 px-3.5 py-1.5 text-sm font-medium text-white'
                : 'inline-flex min-h-10 items-center rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-600 transition hover:border-brand-300 hover:text-brand-700'
            }
          >
            Semua
          </Link>
          {CONTENT_TYPE_ORDER.map((item) => (
            <Link
              key={item}
              href={searchHref(query, item)}
              className={
                type === item
                  ? 'inline-flex min-h-10 items-center rounded-full bg-brand-900 px-3.5 py-1.5 text-sm font-medium text-white'
                  : 'inline-flex min-h-10 items-center rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-600 transition hover:border-brand-300 hover:text-brand-700'
              }
            >
              {CONTENT_SECTIONS[item].title}
            </Link>
          ))}
        </nav>
          </div>
        </section>

        {tooShort ? (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Kata kunci minimal dua karakter.
          </p>
        ) : tooLong ? (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Kata kunci maksimal 100 karakter.
          </p>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
            {error}
          </div>
        ) : !query ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">Mulai dengan kata kunci.</p>
            <p className="mt-1 text-sm text-ink-600">
              Hasil hanya menampilkan konten yang sudah diterbitkan.
            </p>
          </div>
        ) : list && list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">
              Tidak ada konten yang cocok dengan “{query}”.
            </p>
            <p className="mt-1 text-sm text-ink-600">
              Coba kata kunci lain atau pilih jenis konten yang berbeda.
            </p>
          </div>
        ) : list ? (
          <>
            <p className="mt-6 text-xs text-ink-600">
              {list.total} konten ditemukan untuk “{query}”
            </p>

            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((item) => (
                <li key={item.id}>
                  <PublicContentCard item={item} />
                </li>
              ))}
            </ul>

            <Pagination query={query} type={type} page={list.page} totalPages={list.totalPages} />
          </>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
