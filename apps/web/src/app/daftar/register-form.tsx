'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validateSignup, type SignupErrors } from '@/lib/auth/signup';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const fieldClass = (invalid: boolean) =>
  invalid ? `${inputClass} border-red-300 focus:border-red-400 focus:ring-red-100` : inputClass;

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validation = validateSignup({ fullName, email, password, passwordConfirm });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: validation.values.email,
        password: validation.values.password,
        options: {
          data: { full_name: validation.values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/konfirmasi`,
        },
      });

      if (error) {
        setFormError('Pendaftaran belum bisa diproses. Coba lagi beberapa saat lagi.');
        return;
      }

      // Supabase sengaja tidak membocorkan apakah email sudah terdaftar, jadi
      // pesan yang sama ditampilkan untuk keduanya.
      setSentTo(validation.values.email);
    } catch {
      setFormError('Pendaftaran belum dikonfigurasi di server. Hubungi admin.');
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          <p className="font-semibold">Cek email Anda.</p>
          <p className="mt-1">
            Kami mengirim tautan verifikasi ke <span className="font-medium">{sentTo}</span>. Klik
            tautan tersebut untuk mengaktifkan akun, lalu masuk. Bila tidak ada di kotak masuk,
            periksa folder spam.
          </p>
        </div>

        <Link
          href="/masuk"
          className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-ink-800">
          Nama lengkap <span className="font-normal text-ink-500">(opsional)</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={120}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={fieldClass(Boolean(errors.fullName))}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          placeholder="Nama yang tampil di dashboard"
        />
        {errors.fullName ? (
          <p id="fullName-error" className="mt-1.5 text-xs text-red-700">
            {errors.fullName}
          </p>
        ) : null}
      </div>

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
          className={fieldClass(Boolean(errors.email))}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          placeholder="nama@email.com"
        />
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-xs text-red-700">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink-800">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass(Boolean(errors.password))}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          placeholder="Minimal 8 karakter"
        />
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-xs text-red-700">
            {errors.password}
          </p>
        ) : (
          <p id="password-hint" className="mt-1.5 text-xs text-ink-500">
            Gunakan minimal 8 karakter.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="text-sm font-medium text-ink-800">
          Ulangi kata sandi
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          className={fieldClass(Boolean(errors.passwordConfirm))}
          aria-invalid={errors.passwordConfirm ? true : undefined}
          aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
          placeholder="••••••••"
        />
        {errors.passwordConfirm ? (
          <p id="passwordConfirm-error" className="mt-1.5 text-xs text-red-700">
            {errors.passwordConfirm}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Mendaftarkan…' : 'Daftar'}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-500">
        Dengan mendaftar, Anda mendapat akses menulis konten. Publikasi tetap melalui peninjauan
        admin.
      </p>
    </form>
  );
}
