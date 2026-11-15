import { CONTENT_TYPE_LABELS, contentListSchema, type ContentList } from '@webdakwah/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfirmButton } from '@/components/confirm-button';
import { DashboardHeader } from '@/components/dashboard-header';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { formatDate } from '@/lib/format';

import { archiveContentAction, unarchiveContentAction } from './actions';

export const metadata: Metadata = {
  title: 'Kelola terbitan',
  robots: { index: false, follow: false },
};

type ManagedStatus = 'PUBLISHED' | 'ARCHIVED';

const TABS: { value: ManagedStatus; label: string }[] = [
  { value: 'PUBLISHED', label: 'Terbit' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
];

const SUCCESS_MESSAGES: Record<string, string> = {
  diarsipkan: 'Konten diarsipkan dan tidak lagi tampil di halaman publik.',
  dipulihkan: 'Konten dipulihkan dan kembali tampil di halaman publik.',
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readPage(value: string | string[] | undefined): number {
  const page = Number.parseInt(firstValue(value) ?? '1', 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function TerbitanPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    page?: string | string[];
    sukses?: string | string[];
    error?: string | string[];
  }>;
}) {
  const viewer = await requireViewer('/dashboard/terbitan');
  const params = await searchParams;
  const status: ManagedStatus = firstValue(params.status) === 'ARCHIVED' ? 'ARCHIVED' : 'PUBLISHED';
  const page = readPage(params.page);
  const sukses = firstValue(params.sukses);
  const errorParam = firstValue(params.error);
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  let list: ContentList | null = null;
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      list = contentListSchema.parse(
        await apiFetch(`/contents/managed?status=${status}&page=${page}`),
      );
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat terbitan. Coba lagi.';
    }
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <DashboardHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Kelola terbitan</h1>
          <p className="mt-1 text-sm text-ink-600">
            Arsipkan konten yang sudah tidak relevan, atau pulihkan kembali ke halaman publik.
          </p>
        </div>

        {sukses && SUCCESS_MESSAGES[sukses] ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            {SUCCESS_MESSAGES[sukses]}
          </p>
        ) : null}

        {errorParam ? (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errorParam}
          </p>
        ) : null}

        {viewer.status === 'unconfigured' ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Supabase belum dikonfigurasi, jadi daftar terbitan belum bisa dimuat.
          </div>
        ) : !profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah
            dijalankan.
          </div>
        ) : !isAdmin ? (
          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
            Halaman ini khusus admin.
          </div>
        ) : (
          <>
            <nav aria-label="Filter status" className="mt-6 flex gap-2">
              {TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/dashboard/terbitan?status=${tab.value}`}
                  aria-current={status === tab.value ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    status === tab.value
                      ? 'bg-brand-700 text-white'
                      : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            {loadError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                {loadError}
              </div>
            ) : !list || list.items.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-ink-800">
                  {status === 'PUBLISHED'
                    ? 'Belum ada konten terbit.'
                    : 'Belum ada konten yang diarsipkan.'}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {status === 'PUBLISHED'
                    ? 'Terbitkan konten dari antrean moderasi terlebih dahulu.'
                    : 'Konten yang diarsipkan akan muncul di sini.'}
                </p>
              </div>
            ) : (
              <>
                <p className="mt-5 text-xs text-ink-500">{list.total} konten</p>

                <ul className="mt-3 space-y-3">
                  {list.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/konten/${item.id}`}
                            className="text-base font-semibold text-ink-900 transition hover:text-brand-700"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-xs text-ink-500">
                            {CONTENT_TYPE_LABELS[item.type]} ·{' '}
                            {item.author.fullName ?? item.author.email} · Terbit{' '}
                            {item.publishedAt ? formatDate(item.publishedAt) : '—'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-ink-100 text-ink-700'
                          }`}
                        >
                          {status === 'PUBLISHED' ? 'Terbit' : 'Diarsipkan'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/konten/${item.id}`}
                          className="rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                        >
                          Lihat konten
                        </Link>

                        {status === 'PUBLISHED' ? (
                          <form action={archiveContentAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <ConfirmButton
                              message="Arsipkan konten ini? Konten tidak akan tampil di halaman publik."
                              className="rounded-full border border-amber-200 px-4 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-50"
                            >
                              Arsipkan
                            </ConfirmButton>
                          </form>
                        ) : (
                          <form action={unarchiveContentAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                            >
                              Pulihkan
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {list.totalPages > 1 ? (
                  <nav
                    aria-label="Navigasi halaman"
                    className="mt-8 flex items-center justify-between gap-3"
                  >
                    {page > 1 ? (
                      <Link
                        href={`/dashboard/terbitan?status=${status}&page=${page - 1}`}
                        className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                      >
                        ← Sebelumnya
                      </Link>
                    ) : (
                      <span aria-hidden />
                    )}
                    <span className="text-xs text-ink-500">
                      Halaman {list.page} dari {list.totalPages}
                    </span>
                    {page < list.totalPages ? (
                      <Link
                        href={`/dashboard/terbitan?status=${status}&page=${page + 1}`}
                        className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                      >
                        Berikutnya →
                      </Link>
                    ) : (
                      <span aria-hidden />
                    )}
                  </nav>
                ) : null}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
