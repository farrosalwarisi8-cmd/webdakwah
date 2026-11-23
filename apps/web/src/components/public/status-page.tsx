import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface StatusPageProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Tombol aksi (mis. "Coba lagi"); dirender berdampingan dengan tautan beranda. */
  children?: ReactNode;
}

/**
 * Kerangka halaman status (404, galat server, offline) yang dipakai bersama.
 * Sengaja tanpa data server supaya bisa dirender dari error boundary klien.
 */
export function StatusPage({ eyebrow, title, description, children }: StatusPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-soft">
      <header className="border-b border-ink-200/80 bg-surface-soft/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-accent-500 text-ink-950">
              <BookOpen aria-hidden className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
          </Link>
          <Link href="/" className="text-sm text-ink-600 transition hover:text-brand-700">
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg rounded-3xl border border-ink-200 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">{description}</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {children}
            <Link
              href="/"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Ke beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
