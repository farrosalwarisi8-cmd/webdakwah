import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import {
  PASSWORD_RESET_LIMIT_MESSAGE,
  PASSWORD_RESET_SENT_MESSAGE,
} from '@/lib/auth/password-reset';

import { requestPasswordResetAction } from './actions';

export const metadata: Metadata = {
  title: 'Lupa kata sandi',
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default async function LupaSandiPage({
  searchParams,
}: {
  searchParams: Promise<{ terkirim?: string | string[]; batas?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = firstValue(params.terkirim) === '1';
  const limited = firstValue(params.batas) === '1';
  const error = firstValue(params.error);

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
          <Link href="/masuk" className="text-sm text-ink-600 transition hover:text-brand-700">
            Kembali ke halaman masuk
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Lupa kata sandi</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.
          </p>

          {sent ? (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
              {PASSWORD_RESET_SENT_MESSAGE}
            </p>
          ) : null}

          {limited ? (
            <p
              role="alert"
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
            >
              {PASSWORD_RESET_LIMIT_MESSAGE}
            </p>
          ) : null}

          {error === 'email' ? (
            <p
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              Masukkan alamat email yang valid.
            </p>
          ) : null}

          {error && error !== 'email' ? (
            <p
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              Permintaan tidak bisa diproses. Coba lagi beberapa saat lagi.
            </p>
          ) : null}

          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                placeholder="nama@email.com"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Kirim tautan
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-500">
            Ingat kata sandi Anda?{' '}
            <Link
              href="/masuk"
              className="font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Masuk di sini
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
