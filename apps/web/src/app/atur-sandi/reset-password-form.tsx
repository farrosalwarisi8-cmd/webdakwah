'use client';

import { passwordSchema } from '@webdakwah/shared';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Kata sandi tidak valid.');
      return;
    }

    if (confirm !== password) {
      setError('Ulangi kata sandi dengan tepat.');
      return;
    }

    setPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError('Kata sandi tidak bisa disimpan. Minta tautan baru lalu coba lagi.');
        return;
      }

      // Sesi pemulihan tidak dipakai lagi: masuk ulang dengan sandi baru.
      await supabase.auth.signOut().catch(() => undefined);
      router.replace('/masuk?atur=berhasil');
      router.refresh();
    } catch {
      setError('Penyimpanan kata sandi belum dikonfigurasi di server. Hubungi admin.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink-800">
          Kata sandi baru
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          placeholder="Minimal 8 karakter"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="text-sm font-medium text-ink-800">
          Ulangi kata sandi baru
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={inputClass}
          placeholder="Ulangi kata sandi"
        />
      </div>

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
        {pending ? 'Menyimpan…' : 'Simpan kata sandi baru'}
      </button>
    </form>
  );
}
