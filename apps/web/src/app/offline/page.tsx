import { Bookmark, WifiOff } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';

export const metadata: Metadata = {
  title: 'Sedang offline',
  description: 'Halaman cadangan saat perangkat tidak terhubung ke internet.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-surface-soft">
      <SiteHeader />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="grid size-16 place-items-center rounded-full bg-accent-100 text-accent-700">
          <WifiOff aria-hidden className="size-7" />
        </span>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Anda sedang offline
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
          Koneksi internet tidak tersedia. Halaman yang sudah pernah dibuka dan kajian yang Anda
          simpan tetap bisa dibaca dari perangkat ini.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/simpanan"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            <Bookmark aria-hidden className="size-4" />
            Buka simpanan
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-800"
          >
            Coba beranda
          </Link>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-ink-500">
          Simpan kajian saat masih online agar tersedia saat perjalanan tanpa sinyal.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
