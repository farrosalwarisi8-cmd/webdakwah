import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PASSWORD_RESET_EXPIRED_MESSAGE } from '@/lib/auth/password-reset';
import { getViewer } from '@/lib/auth/viewer';

import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Atur kata sandi',
  robots: { index: false, follow: false },
};

export default async function AturSandiPage({
  searchParams,
}: {
  searchParams: Promise<{ siap?: string | string[]; gagal?: string | string[] }>;
}) {
  const viewer = await getViewer();
  const { gagal } = await searchParams;
  const hasRecoverySession = viewer.status === 'authenticated';
  const failed = (Array.isArray(gagal) ? gagal[0] : gagal) === '1';

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
            Halaman masuk
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Atur kata sandi</h1>

          {hasRecoverySession ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Buat kata sandi baru untuk{' '}
                <span className="font-medium text-ink-900">{viewer.email || 'akun Anda'}</span>.
                Setelah tersimpan, Anda akan diminta masuk kembali.
              </p>
              <ResetPasswordForm />
            </>
          ) : (
            <>
              <p
                role="alert"
                className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
              >
                {PASSWORD_RESET_EXPIRED_MESSAGE}
                {failed ? null : ' Buka tautan dari email pemulihan terlebih dahulu.'}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/lupa-sandi"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Minta tautan baru
                </Link>
                <Link
                  href="/masuk"
                  className="inline-flex w-full items-center justify-center rounded-full border border-ink-200 px-6 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Kembali ke halaman masuk
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
