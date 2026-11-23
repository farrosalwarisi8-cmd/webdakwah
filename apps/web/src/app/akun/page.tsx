import { ROLE_LABELS } from '@webdakwah/shared';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { getViewer } from '@/lib/auth/viewer';

import { updateNameAction } from './actions';
import { PasswordForm } from './password-form';

export const metadata: Metadata = {
  title: 'Akun',
  robots: { index: false, follow: false },
};

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string | string[]; error?: string | string[] }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;
  const sukses = Array.isArray(params.sukses) ? params.sukses[0] : params.sukses;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;

  if (viewer.status === 'anonymous') {
    redirect('/masuk?next=/akun');
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <DashboardHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Akun saya</h1>

        {viewer.status === 'unconfigured' ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Supabase belum dikonfigurasi, jadi data akun belum bisa ditampilkan.
          </div>
        ) : viewer.profile ? (
          <dl className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-3xl border border-ink-200 bg-white">
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-500">Email</dt>
              <dd className="text-sm font-medium text-ink-900">{viewer.profile.email}</dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-500">Nama</dt>
              <dd className="text-sm font-medium text-ink-900">
                {viewer.profile.fullName ?? 'Belum diisi'}
              </dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-500">Role</dt>
              <dd className="text-sm font-medium text-ink-900">
                {ROLE_LABELS[viewer.profile.role]}
              </dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-500">Status</dt>
              <dd className="text-sm font-medium text-ink-900">
                {viewer.profile.isActive ? 'Aktif' : 'Dinonaktifkan'}
              </dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <dt className="text-sm text-ink-500">Verifikasi email</dt>
              <dd className="text-sm font-medium text-ink-900">
                {viewer.profile.emailVerifiedAt ? 'Terverifikasi' : 'Belum diverifikasi'}
              </dd>
            </div>
          </dl>
        ) : null}

        {viewer.status === 'authenticated' ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border border-ink-200 bg-white p-5">
              <h2 className="text-base font-semibold text-ink-900">Ubah nama</h2>
              <p className="mt-1 text-xs text-ink-500">Nama ini tampil di dashboard.</p>

              {sukses === 'nama' ? (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
                  Nama berhasil diperbarui.
                </p>
              ) : null}

              {errorParam ? (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                  {errorParam}
                </p>
              ) : null}

              <form action={updateNameAction} className="mt-4 space-y-3">
                <label htmlFor="fullName" className="text-sm font-medium text-ink-800">
                  Nama lengkap
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  minLength={1}
                  maxLength={120}
                  defaultValue={viewer.profile?.fullName ?? ''}
                  className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Simpan nama
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-ink-200 bg-white p-5">
              <h2 className="text-base font-semibold text-ink-900">Ubah kata sandi</h2>
              <p className="mt-1 text-xs text-ink-500">
                Minimal 8 karakter. Sesi Anda tetap aktif setelah sandi diubah.
              </p>
              <PasswordForm />
            </section>
          </div>
        ) : null}

        {viewer.status === 'authenticated' && !viewer.profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil Anda belum tersedia di database. Pastikan migrasi sudah dijalankan dan admin
            sudah mendaftarkan akun ini.
          </div>
        ) : null}
      </main>
    </div>
  );
}
