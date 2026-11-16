import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  contentListSchema,
  type ContentList,
  type ContentStatus,
} from '@webdakwah/shared';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { STATUS_BADGE_STYLES, isAuthorEditable } from '@/lib/content-ui';
import { formatDate } from '@/lib/format';

import { submitContentAction, withdrawContentAction } from './actions';

export const metadata: Metadata = {
  title: 'Konten saya',
  robots: { index: false, follow: false },
};

function isContentStatus(value: string | undefined): value is ContentStatus {
  return CONTENT_STATUSES.some((status) => status === value);
}

export default async function KontenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dihapus?: string }>;
}) {
  const viewer = await requireViewer('/dashboard/konten');
  const { status, dihapus } = await searchParams;
  const statusFilter = isContentStatus(status) ? status : undefined;

  let list: ContentList | null = null;
  let loadError: string | null = null;

  if (viewer.status === 'authenticated' && viewer.profile) {
    try {
      const query = new URLSearchParams({ pageSize: '50' });
      if (statusFilter) {
        query.set('status', statusFilter);
      }

      list = contentListSchema.parse(await apiFetch(`/contents/mine?${query.toString()}`));
    } catch (error) {
      loadError =
        error instanceof ApiError ? error.message : 'Gagal memuat daftar konten. Coba lagi.';
    }
  }

  return (
    <main className="py-2 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Konten saya</h1>
          <p className="mt-1 text-sm text-ink-600">
            Tulis draft, lalu ajukan ke admin untuk ditinjau sebelum terbit.
          </p>
        </div>
        <Link
          href="/dashboard/konten/baru"
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Plus aria-hidden className="size-4" />
          Konten baru
        </Link>
      </div>

      {dihapus ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Konten berhasil dihapus.
        </p>
      ) : null}

      {viewer.status === 'unconfigured' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Supabase belum dikonfigurasi. Isi variabel environment lebih dulu untuk menulis konten.
        </div>
      ) : !viewer.profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah
          dijalankan.
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
          {loadError}
        </div>
      ) : (
        <>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter status konten">
            <Link
              href="/dashboard/konten"
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                statusFilter
                  ? 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
                  : 'bg-brand-700 text-white'
              }`}
            >
              Semua
            </Link>
            {CONTENT_STATUSES.map((value) => (
              <Link
                key={value}
                href={`/dashboard/konten?status=${value}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  statusFilter === value
                    ? 'bg-brand-700 text-white'
                    : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {CONTENT_STATUS_LABELS[value]}
              </Link>
            ))}
          </nav>

          {!list || list.items.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-ink-800">
                {statusFilter ? 'Tidak ada konten dengan status ini.' : 'Belum ada konten.'}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Mulai dengan menulis artikel atau menautkan kajian.
              </p>
              <Link
                href="/dashboard/konten/baru"
                className="mt-5 inline-flex rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Buat konten pertama
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {list.items.map((item) => (
                <li key={item.id} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/konten/${item.id}`}
                        className="text-base font-semibold text-ink-900 transition hover:text-brand-700"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-ink-500">
                        {CONTENT_TYPE_LABELS[item.type]} · Diperbarui {formatDate(item.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[item.status]}`}
                    >
                      {CONTENT_STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  {item.excerpt ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">
                      {item.excerpt}
                    </p>
                  ) : null}

                  {item.status === 'REJECTED' && item.reviewNote ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                      Catatan admin: {item.reviewNote}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/konten/${item.id}`}
                      className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      Buka
                    </Link>

                    {isAuthorEditable(item.status) ? (
                      <form action={submitContentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
                        >
                          Ajukan review
                        </button>
                      </form>
                    ) : null}

                    {item.status === 'PENDING_REVIEW' ? (
                      <form action={withdrawContentAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-ink-300 hover:text-ink-800"
                        >
                          Tarik kembali
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
