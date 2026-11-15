import type { ContentType } from '@webdakwah/shared';
import Link from 'next/link';

import { PublicApiError, getPublicList } from '@/lib/api/public';
import { CONTENT_SECTIONS, sectionPath } from '@/lib/content-routes';

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
          className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          ← Sebelumnya
        </Link>
      ) : (
        <span aria-hidden />
      )}

      <span className="text-xs text-ink-500">
        Halaman {page} dari {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
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

export async function ContentListPage({ type, page }: { type: ContentType; page: number }) {
  const section = CONTENT_SECTIONS[type];

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
    <div className="min-h-dvh bg-ink-50">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Remah roti" className="text-xs text-ink-500">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">{section.title}</span>
        </nav>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {section.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
          {section.description}
        </p>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
            {error}
          </div>
        ) : !list || list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">Belum ada konten terbit.</p>
            <p className="mt-1 text-sm text-ink-500">
              Konten yang sudah ditinjau admin akan tampil di sini.
            </p>
            <Link
              href={sectionPath(type)}
              className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:underline"
            >
              Muat ulang halaman
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs text-ink-500">{list.total} konten terbit</p>

            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
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
