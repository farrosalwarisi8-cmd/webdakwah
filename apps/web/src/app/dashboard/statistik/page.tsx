import type { Metadata } from 'next';

import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import { CONTENT_TYPE_LABELS, CONTENT_STATUS_LABELS } from '@webdakwah/shared';

export const metadata: Metadata = {
  title: 'Statistik',
  robots: { index: false, follow: false },
};

type StatsSummary = {
  contentsByStatus: Record<string, number>;
  contentsByType: Record<string, number>;
  usersByRole: Record<string, number>;
  totalContents: number;
  totalUsers: number;
  recentContents: {
    id: string;
    title: string;
    type: string;
    status: string;
    authorName: string | null;
    updatedAt: string;
  }[];
};

export default async function StatistikPage() {
  const viewer = await requireViewer('/dashboard/statistik');
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  let stats: StatsSummary | null = null;
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      stats = await apiFetch<StatsSummary>('/stats');
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat statistik. Coba lagi.';
    }
  }

  return (
    <main className="py-2 sm:py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Statistik</h1>
        <p className="mt-1 text-sm text-ink-600">Ringkasan konten dan pengguna untuk admin.</p>
      </div>

      {viewer.status === 'unconfigured' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Supabase belum dikonfigurasi.
        </div>
      ) : !profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Profil Anda belum terbaca dari API.
        </div>
      ) : !isAdmin ? (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
          Halaman ini khusus admin.
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
          {loadError}
        </div>
      ) : stats ? (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <p className="text-xs text-ink-500">Total konten</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">{stats.totalContents}</p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <p className="text-xs text-ink-500">Total pengguna</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">{stats.totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <p className="text-xs text-ink-500">Menunggu review</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">
                {stats.contentsByStatus.PENDING_REVIEW ?? 0}
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-ink-200 bg-white p-6">
              <h2 className="text-base font-semibold text-ink-900">Konten per status</h2>
              <ul className="mt-3 space-y-2">
                {Object.entries(stats.contentsByStatus).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">
                      {CONTENT_STATUS_LABELS[status as keyof typeof CONTENT_STATUS_LABELS] ??
                        status}
                    </span>
                    <span className="font-medium text-ink-900">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-ink-200 bg-white p-6">
              <h2 className="text-base font-semibold text-ink-900">Konten per jenis</h2>
              <ul className="mt-3 space-y-2">
                {Object.entries(stats.contentsByType).map(([type, count]) => (
                  <li key={type} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">
                      {CONTENT_TYPE_LABELS[type as keyof typeof CONTENT_TYPE_LABELS] ?? type}
                    </span>
                    <span className="font-medium text-ink-900">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-ink-200 bg-white p-6">
            <h2 className="text-base font-semibold text-ink-900">Aktivitas terbaru</h2>
            {stats.recentContents.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">Belum ada konten.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink-100">
                {stats.recentContents.map((content) => (
                  <li key={content.id} className="py-2.5">
                    <p className="text-sm font-medium text-ink-900">{content.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {CONTENT_TYPE_LABELS[content.type as keyof typeof CONTENT_TYPE_LABELS] ??
                        content.type}{' '}
                      ·{' '}
                      {CONTENT_STATUS_LABELS[
                        content.status as keyof typeof CONTENT_STATUS_LABELS
                      ] ?? content.status}{' '}
                      · {content.authorName ?? '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
