import {
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  contentDetailSchema,
  type ContentDetail,
} from '@webdakwah/shared';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfirmButton } from '@/components/confirm-button';
import { DashboardHeader } from '@/components/dashboard-header';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { STATUS_BADGE_STYLES, isAuthorEditable } from '@/lib/content-ui';
import { formatDate, formatDateTime } from '@/lib/format';

import {
  deleteContentAction,
  submitContentAction,
  updateContentAction,
  withdrawContentAction,
} from '../actions';
import { ContentForm } from '../content-form';

export const metadata: Metadata = {
  title: 'Sunting konten',
  robots: { index: false, follow: false },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  tersimpan: 'Perubahan tersimpan sebagai draft.',
  diajukan: 'Konten diajukan untuk ditinjau admin.',
  ditarik: 'Konten ditarik kembali menjadi draft.',
};

export default async function SuntingKontenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sukses?: string; error?: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer(`/dashboard/konten/${id}`);
  const { sukses, error: errorParam } = await searchParams;

  let content: ContentDetail | null = null;
  let loadError: string | null = null;

  if (viewer.status === 'authenticated' && viewer.profile) {
    try {
      content = contentDetailSchema.parse(await apiFetch(`/contents/${encodeURIComponent(id)}`));
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat konten. Coba lagi.';
    }
  }

  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const canEdit = content
    ? profile?.role === 'ADMIN'
      ? content.status !== 'PUBLISHED' && content.status !== 'ARCHIVED'
      : isAuthorEditable(content.status)
    : false;
  const canDelete =
    content && canEdit && (profile?.role === 'ADMIN' || isAuthorEditable(content.status));

  return (
    <div className="min-h-dvh bg-ink-50">
      <DashboardHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href="/dashboard/konten"
          className="text-sm text-ink-500 transition hover:text-brand-700"
        >
          ← Kembali ke daftar
        </Link>

        {viewer.status === 'unconfigured' || !profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            {viewer.status === 'unconfigured'
              ? 'Supabase belum dikonfigurasi, jadi konten belum bisa dibuka.'
              : 'Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah dijalankan.'}
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
                  {CONTENT_TYPE_LABELS[content.type]} · Diperbarui{' '}
                  {formatDateTime(content.updatedAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[content.status]}`}
              >
                {CONTENT_STATUS_LABELS[content.status]}
              </span>
            </div>

            {sukses && SUCCESS_MESSAGES[sukses] ? (
              <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
                {SUCCESS_MESSAGES[sukses]}
              </p>
            ) : null}

            {errorParam ? (
              <p
                role="alert"
                className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {errorParam}
              </p>
            ) : null}

            {content.status === 'REJECTED' ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                <p className="font-medium">Konten ini ditolak admin.</p>
                {content.reviewNote ? <p className="mt-1">Catatan: {content.reviewNote}</p> : null}
                <p className="mt-1">Perbaiki isinya lalu ajukan review kembali.</p>
              </div>
            ) : null}

            {content.status === 'PENDING_REVIEW' ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                Konten sedang ditinjau admin. Tarik kembali ke draft bila perlu disunting lagi.
              </div>
            ) : null}

            {content.mediaUrl ? (
              <a
                href={content.mediaUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-flex items-center gap-2 break-all rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-brand-700 transition hover:border-brand-300"
              >
                <ExternalLink aria-hidden className="size-4 shrink-0" />
                {content.mediaUrl}
              </a>
            ) : null}

            {canEdit ? (
              <ContentForm
                action={updateContentAction}
                contentId={content.id}
                submitLabel="Simpan perubahan"
                initial={{
                  type: content.type,
                  title: content.title,
                  excerpt: content.excerpt ?? '',
                  body: content.body ?? '',
                  mediaUrl: content.mediaUrl ?? '',
                }}
              />
            ) : content.body ? (
              <article className="mt-6 whitespace-pre-line rounded-3xl border border-ink-200 bg-white p-6 text-sm leading-relaxed text-ink-800">
                {content.body}
              </article>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-6">
              {content.status === 'DRAFT' || content.status === 'REJECTED' ? (
                <form action={submitContentAction}>
                  <input type="hidden" name="id" value={content.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Ajukan review
                  </button>
                </form>
              ) : null}

              {content.status === 'PENDING_REVIEW' ? (
                <form action={withdrawContentAction}>
                  <input type="hidden" name="id" value={content.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:border-ink-300"
                  >
                    Tarik kembali ke draft
                  </button>
                </form>
              ) : null}

              {canDelete ? (
                <form action={deleteContentAction}>
                  <input type="hidden" name="id" value={content.id} />
                  <ConfirmButton
                    message="Hapus konten ini? Tindakan tidak bisa dibatalkan."
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Hapus
                  </ConfirmButton>
                </form>
              ) : null}

              <span className="ml-auto text-xs text-ink-500">
                Dibuat {formatDate(content.createdAt)} oleh{' '}
                {content.author.fullName ?? content.author.email}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
