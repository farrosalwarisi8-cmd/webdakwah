'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { CONNECTING_HINT_MS, RequestTimeoutError, withTimeout } from '@/lib/http/resilience';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const SIGN_IN_TIMEOUT_MS = 12_000;

interface LoginFormProps {
  nextPath: string;
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);

  async function attemptSignIn() {
    const supabase = createSupabaseBrowserClient();

    return withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
      SIGN_IN_TIMEOUT_MS,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSlow(false);

    const hint = setTimeout(() => setSlow(true), CONNECTING_HINT_MS);

    try {
      // Server gratis bisa tertidur: satu percobaan ulang hanya untuk gangguan jaringan.
      let result;

      try {
        result = await attemptSignIn();
      } catch (first) {
        if (!(first instanceof RequestTimeoutError)) {
          throw first;
        }

        result = await attemptSignIn();
      }

      if (result.error) {
        const retryable =
          (result.error as { status?: number }).status === 0 ||
          result.error.name === 'AuthRetryableFetchError';

        setError(
          retryable
            ? 'Server belum merespons. Tunggu sebentar lalu coba lagi.'
            : 'Email atau kata sandi tidak cocok. Silakan coba lagi.',
        );
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof RequestTimeoutError
          ? 'Server belum merespons. Tunggu sebentar lalu coba lagi.'
          : 'Login belum dikonfigurasi di server. Hubungi admin.',
      );
    } finally {
      clearTimeout(hint);
      setPending(false);
      setSlow(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          placeholder="nama@email.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm font-medium text-ink-800">
            Kata sandi
          </label>
          <Link
            href="/lupa-sandi"
            className="text-xs font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {pending && slow ? (
        <p role="status" className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800">
          Menghubungkan ke server, mohon tunggu sebentar…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Memeriksa…' : 'Masuk'}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-500">
        Belum punya akun?{' '}
        <Link
          href="/daftar"
          className="font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Daftar sebagai kontributor
        </Link>
        . Akun baru perlu verifikasi email sebelum bisa masuk.
      </p>
    </form>
  );
}
