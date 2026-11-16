import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { signOutAction } from '@/lib/auth/actions';
import { getViewer } from '@/lib/auth/viewer';

export async function DashboardHeader() {
  const viewer = await getViewer();
  const isAdmin = viewer.status === 'authenticated' && viewer.profile?.role === 'ADMIN';

  return (
    <header className="border-b border-ink-200/80 bg-surface-soft/85">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-accent-500 text-ink-950">
            <BookOpen aria-hidden className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/dashboard"
            className="hidden text-ink-600 transition hover:text-brand-700 sm:inline"
          >
            Dashboard
          </Link>
          <Link href="/dashboard/konten" className="text-ink-600 transition hover:text-brand-700">
            Konten saya
          </Link>{' '}
          {isAdmin ? (
            <>
              <Link
                href="/dashboard/terbitan"
                className="text-ink-600 transition hover:text-brand-700"
              >
                Terbitan
              </Link>
              <Link
                href="/dashboard/moderasi"
                className="text-ink-600 transition hover:text-brand-700"
              >
                Moderasi
              </Link>
              <Link
                href="/dashboard/pengguna"
                className="text-ink-600 transition hover:text-brand-700"
              >
                Pengguna
              </Link>
              <Link
                href="/dashboard/statistik"
                className="text-ink-600 transition hover:text-brand-700"
              >
                Statistik
              </Link>
            </>
          ) : null}
          <Link
            href="/akun"
            className="hidden text-ink-600 transition hover:text-brand-700 sm:inline"
          >
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
  );
}
