import { ROLE_LABELS } from '@webdakwah/shared';
import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { signOutAction } from '@/lib/auth/actions';
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
      <header className="border-b border-ink-200/80 bg-ink-50/85">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-brand-50">
              <BookOpen aria-hidden className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/akun" className="text-ink-600 transition hover:text-brand-700">
              Akun
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Keluar
              </button>
            </form>
          </nav>
        </div>
      </header>

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
              <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
                Editor konten hadir pada fase berikutnya. Untuk sekarang dashboard ini memastikan
                autentikasi dan pembatasan role berjalan.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
