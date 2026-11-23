import type { Metadata } from 'next';
import Link from 'next/link';

import { apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import { createContentAction } from '../actions';
import { ContentForm } from '../content-form';

export const metadata: Metadata = {
  title: 'Konten baru',
  robots: { index: false, follow: false },
};

export default async function KontenBaruPage() {
  const viewer = await requireViewer('/dashboard/konten/baru');

  let taxonomy:
    | { categories: { id: string; name: string }[]; speakers: { id: string; name: string }[] }
    | undefined;

  if (viewer.status === 'authenticated' && viewer.profile) {
    try {
      const [categories, speakers] = await Promise.all([
        apiFetch<{ id: string; name: string }[]>('/categories/options'),
        apiFetch<{ id: string; name: string }[]>('/speakers/options'),
      ]);
      taxonomy = { categories, speakers };
    } catch {
      taxonomy = { categories: [], speakers: [] };
    }
  }

  return (
    <main className="max-w-3xl py-2 sm:py-4">
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
        <ContentForm
          action={createContentAction}
          submitLabel="Simpan draft"
          taxonomy={taxonomy}
          role={viewer.status === 'authenticated' ? viewer.profile?.role : undefined}
        />
      )}
    </main>
  );
}
