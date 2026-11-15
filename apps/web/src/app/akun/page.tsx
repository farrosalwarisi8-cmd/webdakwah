import { ROLE_LABELS } from '@webdakwah/shared';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = {
  title: 'Akun',
  robots: { index: false, follow: false },
};

export default async function AkunPage() {
  const viewer = await getViewer();

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
          </dl>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Profil Anda belum tersedia di database. Pastikan migrasi sudah dijalankan dan admin
            sudah mendaftarkan akun ini.
          </div>
        )}
      </main>
    </div>
  );
}
