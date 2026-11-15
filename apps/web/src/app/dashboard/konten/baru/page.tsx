import type { Metadata } from 'next';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { requireViewer } from '@/lib/auth/require';

import { createContentAction } from '../actions';
import { ContentForm } from '../content-form';

export const metadata: Metadata = {
  title: 'Konten baru',
  robots: { index: false, follow: false },
};

export default async function KontenBaruPage() {
  const viewer = await requireViewer('/dashboard/konten/baru');

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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">Konten baru</h1>
        <p className="mt-1 text-sm text-ink-600">
          Simpan sebagai draft lebih dulu, lalu ajukan review saat sudah siap.
        </p>

        {viewer.status === 'unconfigured' || !viewer.profile ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            {viewer.status === 'unconfigured'
              ? 'Supabase belum dikonfigurasi, jadi editor belum bisa dipakai.'
              : 'Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah dijalankan.'}
          </div>
        ) : (
          <ContentForm action={createContentAction} submitLabel="Simpan draft" />
        )}
      </main>
    </div>
  );
}
