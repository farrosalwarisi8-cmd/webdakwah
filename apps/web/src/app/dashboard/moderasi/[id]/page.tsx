import { CONTENT_TYPE_LABELS, contentDetailSchema, type ContentDetail } from '@webdakwah/shared';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { formatDateTime } from '@/lib/format';
import { renderBodyHtml } from '@/lib/body-html';

import { publishContentAction, rejectContentAction } from '../actions';

export const metadata: Metadata = {
  title: 'Tinjau konten',
  robots: { index: false, follow: false },
};

export default async function TinjauKontenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer(`/dashboard/moderasi/${id}`);
  const { error: errorParam } = await searchParams;
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  let content: ContentDetail | null = null;
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      content = contentDetailSchema.parse(await apiFetch(`/contents/${encodeURIComponent(id)}`));
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat konten. Coba lagi.';
    }
  }

  const pending = content?.status === 'PENDING_REVIEW';

  return (
    <main className="max-w-3xl py-2 sm:py-4">
      <Link
        href="/dashboard/moderasi"
        className="text-sm text-ink-500 transition hover:text-brand-700"
      >
        ← Kembali ke antrean
      </Link>

      {viewer.status === 'unconfigured' || !profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          {viewer.status === 'unconfigured'
            ? 'Supabase belum dikonfigurasi, jadi konten belum bisa ditinjau.'
            : 'Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah dijalankan.'}
        </div>
      ) : !isAdmin ? (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
          Halaman ini khusus admin.
        </div>
      ) : loadError || !content ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
          {loadError ?? 'Konten tidak ditemukan.'}
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                {content.title}
              </h1>
              <p className="mt-1 text-xs text-ink-500">
                {CONTENT_TYPE_LABELS[content.type]} ·{' '}
                {content.author.fullName ?? content.author.email} · Diajukan{' '}
                {formatDateTime(content.updatedAt)}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              {pending ? 'Menunggu Review' : 'Sudah diproses'}
            </span>
          </div>

          {errorParam ? (
            <p
              role="alert"
              className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {errorParam}
            </p>
          ) : null}

          {content.excerpt ? (
            <p className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
              {content.excerpt}
            </p>
          ) : null}

          {content.mediaUrl ? (
            <a
              href={content.mediaUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-2 break-all rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-brand-700 transition hover:border-brand-300"
            >
              <ExternalLink aria-hidden className="size-4 shrink-0" />
              {content.mediaUrl}
            </a>
          ) : null}

          {content.body ? (
            <article
              className="content-body mt-4 rounded-3xl border border-ink-200 bg-white p-6 text-sm leading-relaxed text-ink-800"
              dangerouslySetInnerHTML={{ __html: renderBodyHtml(content.body) }}
            />
          ) : (
            <p className="mt-4 rounded-2xl bg-ink-100 px-4 py-3 text-sm text-ink-600">
              Tidak ada isi teks. Tinjau tautan media di atas.
            </p>
          )}

          {pending ? (
            <section className="mt-8 rounded-3xl border border-ink-200 bg-white p-6">
              <h2 className="text-base font-semibold text-ink-900">Keputusan moderasi</h2>
              <p className="mt-1 text-sm text-ink-600">
                Terbitkan bila sudah layak, atau tolak dengan catatan agar penulis bisa
                memperbaikinya.
              </p>

              <form action={publishContentAction} className="mt-5">
                <input type="hidden" name="id" value={content.id} />
                <button
                  type="submit"
                  className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Terbitkan konten
                </button>
              </form>

              <form
                action={rejectContentAction}
                className="mt-6 space-y-3 border-t border-ink-100 pt-6"
              >
                <input type="hidden" name="id" value={content.id} />
                <label htmlFor="reviewNote" className="text-sm font-medium text-ink-800">
                  Catatan penolakan
                </label>
                <textarea
                  id="reviewNote"
                  name="reviewNote"
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Contoh: Tambahkan sumber rujukan dan perbaiki judul agar lebih jelas."
                />
                <p className="text-xs text-ink-500">Minimal 10 karakter, maksimal 500.</p>
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  Tolak dan kembalikan ke penulis
                </button>
              </form>
            </section>
          ) : (
            <p className="mt-8 rounded-2xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
              Konten ini sudah diproses dan tidak lagi berada di antrean.
            </p>
          )}
        </>
      )}
    </main>
  );
}
