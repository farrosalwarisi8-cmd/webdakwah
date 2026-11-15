import { CONTENT_TYPE_LABELS, contentListSchema, type ContentList } from '@webdakwah/shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Moderasi konten',
  robots: { index: false, follow: false },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  diterbitkan: 'Konten berhasil diterbitkan.',
  ditolak: 'Konten ditolak dan dikembalikan ke penulis.',
};

export default async function ModerasiPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string }>;
}) {
  const viewer = await requireViewer('/dashboard/moderasi');
  const { sukses } = await searchParams;
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  let list: ContentList | null = null;
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      list = contentListSchema.parse(await apiFetch('/contents/review?pageSize=50'));
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat antrean. Coba lagi.';
    }
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <DashboardHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Antrean moderasi</h1>
            <p className="mt-1 text-sm text-ink-600">
              Konten yang diajukan kontributor, diurutkan dari yang paling lama menunggu.
            </p>
          </div>
          {isAdmin && list ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {list.total} menunggu review
            </span>
          ) : null}
        </div>

        {sukses && SUCCESS_MESSAGES[sukses] ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            {SUCCESS_MESSAGES[sukses]}
          </p>
        ) : null}

        {viewer.status === 'unconfigured' ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Supabase belum dikonfigurasi, jadi antrean belum bisa dimuat.
          </div>
        ) : !profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah
            dijalankan.
          </div>
        ) : !isAdmin ? (
          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
            Halaman ini khusus admin. Anda tetap bisa mengelola konten sendiri di{' '}
            <Link href="/dashboard/konten" className="font-medium text-brand-700 hover:underline">
              Konten saya
            </Link>
            .
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
            {loadError}
          </div>
        ) : !list || list.items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">
              Tidak ada konten yang menunggu review.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Kiriman kontributor akan muncul di sini setelah diajukan.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {list.items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/moderasi/${item.id}`}
                      className="text-base font-semibold text-ink-900 transition hover:text-brand-700"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-ink-500">
                      {CONTENT_TYPE_LABELS[item.type]} · {item.author.fullName ?? item.author.email}{' '}
                      · Diajukan {formatDateTime(item.updatedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    Menunggu Review
                  </span>
                </div>

                {item.excerpt ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">
                    {item.excerpt}
                  </p>
                ) : null}

                <Link
                  href={`/dashboard/moderasi/${item.id}`}
                  className="mt-4 inline-flex rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                >
                  Tinjau konten
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
