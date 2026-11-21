import type { Metadata } from 'next';
import Link from 'next/link';

import { OfflineStatus } from '@/components/public/offline-status';
import { SavedContentList } from '@/components/public/saved-content-list';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';

export const metadata: Metadata = {
  title: 'Simpanan',
  description: 'Kajian yang Anda simpan di perangkat ini.',
  robots: { index: false, follow: true },
};

export default function SimpananPage() {
  return (
    <div className="min-h-dvh bg-surface-soft">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Remah roti" className="text-xs text-ink-600">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">Simpanan</span>
        </nav>

        <div className="mt-4 rounded-[2rem] border border-ink-200/70 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Simpanan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
            Kajian yang Anda tandai tersimpan di perangkat ini, tanpa perlu akun.
          </p>
          <OfflineStatus />
        </div>

        <SavedContentList />
      </main>

      <SiteFooter />
    </div>
  );
}
