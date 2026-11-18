import {
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  ROLE_LABELS,
  contentListSchema,
  type ContentList,
} from '@webdakwah/shared';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { DashboardPageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { STATUS_BADGE_STYLES } from '@/lib/content-ui';
import { CONTENT_TYPE_VISUALS } from '@/lib/content-visuals';
import { formatDate, formatDateTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

function SetupPanel({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <div className="mt-6 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
        <SlidersHorizontal aria-hidden className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-700">{description}</p>
      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="rounded-2xl border border-amber-200/60 bg-white/70 p-3 text-xs leading-relaxed text-ink-700"
          >
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-amber-700">
              LANGKAH {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <Link
        href="/"
        className="btn-press mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 text-xs font-semibold text-amber-900 transition hover:border-amber-400"
      >
        Buka situs publik
      </Link>
    </div>
  );
}

type StatsSummary = {
  contentsByStatus: Record<string, number>;
  totalContents: number;
  totalUsers: number;
};

export default async function DashboardPage() {
  const viewer = await requireViewer('/dashboard');
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  let stats: StatsSummary | null = null;
  let queue: ContentList | null = null;
  let managed: ContentList | null = null;
  let mine: ContentList | null = null;
  let loadError: string | null = null;

  if (profile) {
    if (isAdmin) {
      const [statsResult, queueResult, managedResult] = await Promise.allSettled([
        apiFetch<StatsSummary>('/stats'),
        apiFetch<unknown>('/contents/review?pageSize=3'),
        apiFetch<unknown>('/contents/managed?status=PUBLISHED&page=1'),
      ]);

      if (statsResult.status === 'fulfilled') {
        stats = statsResult.value;
      } else if (statsResult.reason instanceof ApiError) {
        loadError = statsResult.reason.message;
      }

      if (queueResult.status === 'fulfilled') {
        try {
          queue = contentListSchema.parse(queueResult.value);
        } catch {
          loadError ??= 'Antrean review belum bisa dibaca.';
        }
      }

      if (managedResult.status === 'fulfilled') {
        try {
          managed = contentListSchema.parse(managedResult.value);
        } catch {
          loadError ??= 'Daftar terbitan belum bisa dibaca.';
        }
      }
    } else {
      try {
        mine = contentListSchema.parse(await apiFetch('/contents/mine?pageSize=50'));
      } catch (error) {
        loadError = error instanceof ApiError ? error.message : 'Konten Anda belum bisa dimuat.';
      }
    }
  }

  const mineItems = mine?.items ?? [];
  const mineCounts = mineItems.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;

    return counts;
  }, {});

  const pendingValue = isAdmin
    ? (queue?.total ?? stats?.contentsByStatus.PENDING_REVIEW)
    : mine
      ? (mineCounts.PENDING_REVIEW ?? 0)
      : null;
  const publishedValue = isAdmin
    ? (stats?.contentsByStatus.PUBLISHED ?? managed?.total)
    : mine
      ? (mineCounts.PUBLISHED ?? 0)
      : null;
  const draftValue = isAdmin
    ? stats?.contentsByStatus.DRAFT
    : mine
      ? (mineCounts.DRAFT ?? 0)
      : null;

  const queueItems = queue?.items ?? [];
  const recentItems = isAdmin ? (managed?.items.slice(0, 4) ?? []) : mineItems.slice(0, 4);
  const dataMissing =
    profile !== null && stats === null && queue === null && managed === null && mine === null;

  return (
    <main className="py-1 sm:py-2">
      <DashboardPageHeader
        eyebrow={profile ? ROLE_LABELS[profile.role] : 'Ruang kerja'}
        title="Ringkasan"
        description={
          isAdmin
            ? 'Pantau antrean peninjauan, konten terbit, dan aktivitas pengguna dari satu tempat.'
            : 'Kelola draf, ikuti status peninjauan, dan lanjutkan karya Anda berikutnya.'
        }
        actions={
          profile ? (
            <>
              {isAdmin ? (
                <Link
                  href="/dashboard/moderasi"
                  className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-800"
                >
                  <ShieldCheck aria-hidden className="size-4" />
                  Antrean review
                  {pendingValue !== null && pendingValue !== undefined && pendingValue > 0 ? (
                    <span className="grid min-w-5 place-items-center rounded-full bg-accent-100 px-1.5 text-[10px] font-bold text-accent-900">
                      {pendingValue}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <Link
                href="/dashboard/konten/baru"
                className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-900 px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-800"
              >
                <Plus aria-hidden className="size-4" />
                Buat konten baru
              </Link>
            </>
          ) : null
        }
      />

      {viewer.status === 'unconfigured' ? (
        <SetupPanel
          title="Ruang kerja belum terhubung"
          description="Dashboard membutuhkan koneksi Supabase. Situs publik tetap bisa dibuka pengunjung tanpa konfigurasi ini."
          steps={[
            'Isi kredensial Supabase pada environment aplikasi web.',
            'Jalankan migrasi database agar tabel profil dan konten tersedia.',
            'Muat ulang halaman ini lalu masuk dengan akun contributor atau admin.',
          ]}
        />
      ) : !profile ? (
        <SetupPanel
          title="Profil Anda belum terbaca"
          description="Akun berhasil dikenali, tetapi profilnya belum tersedia di API. Dashboard akan menampilkan data setelah profil terdaftar."
          steps={[
            'Pastikan API berjalan dan dapat dihubungi dari aplikasi web.',
            'Jalankan migrasi database bila tabel profil belum ada.',
            'Pastikan akun ini terdaftar sebagai contributor atau admin.',
          ]}
        />
      ) : (
        <>
          {loadError ? (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              {loadError} Sebagian ringkasan mungkin belum lengkap.
            </p>
          ) : dataMissing ? (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              Data ringkasan belum bisa dimuat. Coba muat ulang halaman beberapa saat lagi.
            </p>
          ) : null}

          <section
            aria-label="Statistik singkat"
            className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {isAdmin ? (
              <>
                <StatCard
                  label="Menunggu review"
                  value={pendingValue ?? '—'}
                  hint="Perlu keputusan admin"
                  icon={Clock3}
                  tone="amber"
                  href="/dashboard/moderasi"
                />
                <StatCard
                  label="Konten terbit"
                  value={publishedValue ?? '—'}
                  hint="Tampil di halaman publik"
                  icon={CheckCircle2}
                  tone="brand"
                  href="/dashboard/terbitan"
                />
                <StatCard
                  label="Draf"
                  value={draftValue ?? '—'}
                  hint="Masih disiapkan penulis"
                  icon={FileText}
                  tone="ink"
                  href="/dashboard/terbitan"
                />
                <StatCard
                  label="Pengguna"
                  value={stats?.totalUsers ?? '—'}
                  hint="Kontributor dan admin"
                  icon={Users}
                  tone="brand"
                  href="/dashboard/pengguna"
                />
              </>
            ) : (
              <>
                <StatCard
                  label="Draf"
                  value={draftValue ?? '—'}
                  hint="Belum diajukan"
                  icon={FileText}
                  tone="ink"
                  href="/dashboard/konten?status=DRAFT"
                />
                <StatCard
                  label="Menunggu review"
                  value={pendingValue ?? '—'}
                  hint="Sedang ditinjau admin"
                  icon={Clock3}
                  tone="amber"
                  href="/dashboard/konten?status=PENDING_REVIEW"
                />
                <StatCard
                  label="Terbit"
                  value={publishedValue ?? '—'}
                  hint="Sudah tayang"
                  icon={CheckCircle2}
                  tone="brand"
                  href="/dashboard/konten?status=PUBLISHED"
                />
                <StatCard
                  label="Total konten"
                  value={mine?.total ?? '—'}
                  hint="Semua karya Anda"
                  icon={BarChart3}
                  tone="brand"
                  href="/dashboard/konten"
                />
              </>
            )}
          </section>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr] xl:items-start">
            {isAdmin ? (
              <section className="overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
                  <div>
                    <h2 className="text-base font-semibold text-ink-900">Antrean review</h2>
                    <p className="mt-1 text-xs text-ink-600">
                      Kiriman terlama ditampilkan lebih dulu.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/moderasi"
                    className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-900"
                  >
                    Lihat semua
                  </Link>
                </div>

                {queueItems.length === 0 ? (
                  <div className="p-6 text-center sm:p-8">
                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                      <CheckCircle2 aria-hidden className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-ink-800">Antrean sedang kosong</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-600">
                      Tidak ada kiriman yang menunggu peninjauan saat ini.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {queueItems.map((item) => {
                      const visual = CONTENT_TYPE_VISUALS[item.type];
                      const Icon = visual.icon;

                      return (
                        <li key={item.id}>
                          <Link
                            href={`/dashboard/moderasi/${item.id}`}
                            className="group flex items-center gap-3 p-4 transition hover:bg-surface-soft sm:px-5"
                          >
                            <span
                              className={`grid size-10 shrink-0 place-items-center rounded-xl ${visual.iconWrap}`}
                            >
                              <Icon aria-hidden className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900 group-hover:text-brand-800">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-ink-600">
                                {CONTENT_TYPE_LABELS[item.type]} ·{' '}
                                {item.author.fullName ?? item.author.email} ·{' '}
                                {formatDateTime(item.updatedAt)}
                              </span>
                            </span>
                            <span className="hidden shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-semibold text-accent-900 sm:inline-flex">
                              Tinjau
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : null}

            <section className="overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
                <div>
                  <h2 className="text-base font-semibold text-ink-900">
                    {isAdmin ? 'Terbit terbaru' : 'Konten terbaru'}
                  </h2>
                  <p className="mt-1 text-xs text-ink-600">
                    {isAdmin
                      ? 'Konten publik yang baru diperbarui.'
                      : 'Lanjutkan atau pantau statusnya.'}
                  </p>
                </div>
                <Link
                  href={isAdmin ? '/dashboard/terbitan' : '/dashboard/konten'}
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-900"
                >
                  {isAdmin ? 'Kelola' : 'Semua'}
                </Link>
              </div>

              {recentItems.length === 0 ? (
                <div className="p-6 text-center sm:p-8">
                  <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <FileText aria-hidden className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink-800">
                    {isAdmin ? 'Belum ada konten terbit' : 'Belum ada konten'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">
                    {isAdmin
                      ? 'Konten yang diterbitkan akan muncul di sini.'
                      : 'Mulai dengan menulis artikel atau menautkan kajian.'}
                  </p>
                  {!isAdmin ? (
                    <Link
                      href="/dashboard/konten/baru"
                      className="btn-press mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-900 px-4 text-xs font-semibold text-white transition hover:bg-brand-800"
                    >
                      <Plus aria-hidden className="size-3.5" />
                      Buat konten
                    </Link>
                  ) : null}
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {recentItems.map((item) => {
                    const visual = CONTENT_TYPE_VISUALS[item.type];
                    const Icon = visual.icon;
                    const href = `/dashboard/konten/${item.id}`;

                    return (
                      <li key={item.id}>
                        <Link
                          href={href}
                          className="group flex items-center gap-3 p-4 transition hover:bg-surface-soft sm:px-5"
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-lg ${visual.iconWrap}`}
                          >
                            <Icon aria-hidden className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink-900 group-hover:text-brand-800">
                              {item.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-600">
                              <span
                                className={`rounded px-1.5 py-0.5 font-medium ${STATUS_BADGE_STYLES[item.status]}`}
                              >
                                {CONTENT_STATUS_LABELS[item.status]}
                              </span>
                              <span className="truncate">{formatDate(item.updatedAt)}</span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {isAdmin ? (
            <section aria-label="Pintasan admin" className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: '/dashboard/pengguna',
                  label: 'Kelola pengguna',
                  description: 'Atur akses kontributor dan admin.',
                  icon: Users,
                },
                {
                  href: '/dashboard/statistik',
                  label: 'Statistik',
                  description: 'Lihat sebaran konten dan pengguna.',
                  icon: BarChart3,
                },
                {
                  href: '/dashboard/siaran',
                  label: 'Siaran',
                  description: 'Perbarui informasi siaran langsung.',
                  icon: Radio,
                },
              ].map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="card-lift flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft hover:border-brand-200"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-brand-700">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-900">{label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-600">
                      {description}
                    </span>
                  </span>
                </Link>
              ))}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
