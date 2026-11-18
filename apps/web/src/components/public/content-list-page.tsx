import type { ContentType } from '@webdakwah/shared';
import { AlertTriangle, ArrowLeft, ArrowRight, Compass, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { PublicApiError, getPublicList } from '@/lib/api/public';
import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';
import { CONTENT_TYPE_VISUALS } from '@/lib/content-visuals';

import { PublicContentCard } from './content-card';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Navigasi halaman" className="mt-10 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={`${basePath}?page=${page - 1}`}
          className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Sebelumnya
        </Link>
      ) : (
        <span aria-hidden />
      )}

      <span className="text-xs text-ink-600">
        Halaman {page} dari {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          Berikutnya
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}

export async function ContentListPage({ type, page }: { type: ContentType; page: number }) {
  const section = CONTENT_SECTIONS[type];
  const visual = CONTENT_TYPE_VISUALS[type];
  const Icon = visual.icon;

  let list = null;
  let error: string | null = null;

  try {
    list = await getPublicList(type, page);
  } catch (caught) {
    error =
      caught instanceof PublicApiError
        ? caught.message
        : 'Konten belum bisa dimuat. Coba lagi beberapa saat.';
  }

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Remah roti" className="flex items-center gap-2 text-xs text-ink-600">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink-700">{section.title}</span>
        </nav>

        <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-ink-200/70 bg-surface-soft p-6 sm:p-8 lg:p-10">
          <div
            aria-hidden
            className="pattern-islamic-ink pointer-events-none absolute inset-0 opacity-70"
          />
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl ${visual.iconWrap}`}
                >
                  <Icon aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-ink-600 uppercase">
                    Koleksi
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                    {section.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
                    {section.description}
                  </p>
                </div>
              </div>

              {list ? (
                <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium whitespace-nowrap text-ink-600">
                  {list.total} konten terbit
                </span>
              ) : null}
            </div>

            <nav aria-label="Jelajah format" className="mt-6 flex flex-wrap gap-2">
              {CONTENT_TYPE_ORDER.map((itemType) => {
                const itemVisual = CONTENT_TYPE_VISUALS[itemType];
                const FormatIcon = itemVisual.icon;
                const active = itemType === type;

                return (
                  <Link
                    key={itemType}
                    href={sectionPath(itemType)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-brand-900 bg-brand-900 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-800'
                    }`}
                  >
                    <FormatIcon aria-hidden className="size-3.5" />
                    {itemVisual.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2.5 text-sm leading-relaxed text-red-800">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
            <Link
              href={sectionPath(type)}
              className="btn-press inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-red-300 bg-white px-4 text-xs font-semibold text-red-800 transition hover:border-red-400"
            >
              <RefreshCw aria-hidden className="size-3.5" />
              Coba lagi
            </Link>
          </div>
        ) : !list || list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-surface-soft p-8 text-center sm:p-12">
            <span
              className={`mx-auto grid size-12 place-items-center rounded-2xl ${visual.iconWrap}`}
            >
              <Icon aria-hidden className="size-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-ink-800">
              {section.title} belum memiliki konten terbit.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-600">
              Setiap kajian melewati peninjauan admin sebelum tayang. Sementara menunggu, telusuri
              format lain atau kembali ke beranda.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                href="/cari"
                className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 sm:w-auto"
              >
                <Compass aria-hidden className="size-4" />
                Jelajah semua kajian
              </Link>
              <Link
                href="/"
                className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink-200 bg-white px-5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-800 sm:w-auto"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-600">
                Menampilkan {list.items.length} dari {list.total} konten
              </p>
              <span className="hidden text-xs text-ink-400 sm:block">
                Diurutkan dari yang terbaru
              </span>
            </div>

            <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((item) => (
                <li key={item.id}>
                  <PublicContentCard item={item} />
                </li>
              ))}
            </ul>

            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              basePath={sectionPath(type)}
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
