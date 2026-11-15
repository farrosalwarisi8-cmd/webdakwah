import { ROLE_LABELS } from '@webdakwah/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const viewer = await getViewer();

  if (viewer.status === 'anonymous') {
    redirect('/masuk?next=/dashboard');
  }

  const profile = viewer.status === 'authenticated' ? viewer.profile : null;

  return (
    <div className="min-h-dvh bg-ink-50">
      <DashboardHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>

        {viewer.status === 'unconfigured' ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Supabase belum dikonfigurasi. Isi variabel environment lebih dulu untuk memakai
            dashboard.
          </div>
        ) : !profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil Anda belum terbaca dari API. Pastikan API berjalan, migrasi database sudah
            dijalankan, dan akun ini terdaftar.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-ink-200 bg-white p-6">
              <p className="text-sm text-ink-500">Masuk sebagai</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">
                {profile.fullName ?? profile.email}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                {ROLE_LABELS[profile.role]}
              </span>
            </section>

            <section className="rounded-3xl border border-ink-200 bg-white p-6">
              <h2 className="text-base font-semibold text-ink-900">
                {profile.role === 'ADMIN' ? 'Tugas admin' : 'Tugas kontributor'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {profile.role === 'ADMIN'
                  ? 'Meninjau kiriman kontributor, menerbitkan atau menolak materi, dan mengelola akses pengguna.'
                  : 'Menulis artikel, mengunggah audio kajian dan video, lalu mengirimkannya untuk ditinjau admin sebelum terbit.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/konten"
                  className="inline-flex rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Buka konten saya
                </Link>
                {profile.role === 'ADMIN' ? (
                  <Link
                    href="/dashboard/moderasi"
                    className="inline-flex rounded-full border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    Antrean moderasi
                  </Link>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
