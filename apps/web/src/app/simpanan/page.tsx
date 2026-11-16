import type { Metadata } from 'next';
import Link from 'next/link';

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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Remah roti" className="text-xs text-ink-500">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">Simpanan</span>
        </nav>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Simpanan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
          Kajian yang Anda tandai tersimpan di perangkat ini, tanpa perlu akun.
        </p>

        <SavedContentList />
      </main>

      <SiteFooter />
    </div>
  );
}
