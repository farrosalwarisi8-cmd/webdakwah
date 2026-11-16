import type { PublicContentList } from '@webdakwah/shared';
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
    <div className="min-h-dvh bg-ink-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
          {description}
        </p>

        {list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">Belum ada konten terbit.</p>
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
            {list.totalPages > 1 ? (
              <nav className="mt-10 flex items-center justify-between gap-3">
                {page > 1 ? (
                  <Link
                    href={`${basePath}?page=${page - 1}`}
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700"
                  >
                    ← Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-ink-500">
                  Halaman {page} dari {list.totalPages}
                </span>
                {page < list.totalPages ? (
                  <Link
                    href={`${basePath}?page=${page + 1}`}
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700"
                  >
                    Berikutnya →
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
