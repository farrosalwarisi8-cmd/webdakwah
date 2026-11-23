import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getViewer } from '@/lib/auth/viewer';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Masuk',
  robots: { index: false, follow: false },
};

function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/dashboard';
  }

  return candidate;
}

const CONFIRMATION_MESSAGES: Record<string, { tone: 'success' | 'error'; text: string }> = {
  berhasil: {
    tone: 'success',
    text: 'Email berhasil diverifikasi. Silakan masuk dengan kata sandi Anda.',
  },
  gagal: {
    tone: 'error',
    text: 'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan daftar ulang dengan email yang sama untuk meminta tautan baru.',
  },
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    konfirmasi?: string | string[];
    atur?: string | string[];
  }>;
}) {
  const viewer = await getViewer();

  if (viewer.status === 'authenticated') {
    redirect('/dashboard');
  }

  const { next, konfirmasi, atur } = await searchParams;
  const confirmation =
    CONFIRMATION_MESSAGES[Array.isArray(konfirmasi) ? (konfirmasi[0] ?? '') : (konfirmasi ?? '')];
  const passwordUpdated = (Array.isArray(atur) ? (atur[0] ?? '') : (atur ?? '')) === 'berhasil';

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
        <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Masuk</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Khusus admin dan kontributor untuk menulis serta meninjau materi dakwah.
          </p>

          {passwordUpdated ? (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
              Kata sandi baru tersimpan. Silakan masuk dengan kata sandi tersebut.
            </p>
          ) : null}

          {confirmation ? (
            <p
              role={confirmation.tone === 'error' ? 'alert' : undefined}
              className={`mt-6 rounded-2xl border p-4 text-sm leading-relaxed ${
                confirmation.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {confirmation.text}
            </p>
          ) : null}

          {viewer.status === 'unconfigured' ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Login belum aktif karena{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> dan{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> belum diisi
              di <code className="font-mono text-xs">apps/web/.env.local</code>.
            </div>
          ) : (
            <LoginForm nextPath={safeNextPath(next)} />
          )}
        </div>
      </main>
    </div>
  );
}
