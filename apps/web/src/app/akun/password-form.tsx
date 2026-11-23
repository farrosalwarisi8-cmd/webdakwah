'use client';

import { passwordSchema } from '@webdakwah/shared';
import { useState, type FormEvent } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

/** Ubah kata sandi pemilik akun yang sedang masuk; sesi tetap aktif. */
export function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);

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
        setError('Kata sandi tidak bisa diubah. Coba lagi beberapa saat lagi.');
        return;
      }

      setPassword('');
      setConfirm('');
      setDone(true);
    } catch {
      setError('Pengaturan akun belum dikonfigurasi di server.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="newPassword" className="text-sm font-medium text-ink-800">
          Kata sandi baru
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="newPasswordConfirm" className="text-sm font-medium text-ink-800">
          Ulangi kata sandi baru
        </label>
        <input
          id="newPasswordConfirm"
          name="newPasswordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Kata sandi berhasil diperbarui.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Ubah kata sandi'}
      </button>
    </form>
  );
}
