'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  isValidEmail,
  normalizeEmail,
  passwordResetOutcome,
  requestKeyFromHeaders,
} from '@/lib/auth/password-reset';
import { PASSWORD_RESET_LIMIT, SlidingWindowLimiter } from '@/lib/rate-limit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const limiter = new SlidingWindowLimiter(PASSWORD_RESET_LIMIT.limit, PASSWORD_RESET_LIMIT.windowMs);

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * Meminta tautan pemulihan sandi. Hasil akhirnya selalu sama: pengunjung tidak
 * bisa memakai halaman ini untuk menebak email mana yang terdaftar.
 */
export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const headerList = await headers();
  const decision = limiter.check(requestKeyFromHeaders(headerList));

  if (!decision.allowed) {
    redirect('/lupa-sandi?batas=1');
  }

  if (!isValidEmail(email)) {
    redirect('/lupa-sandi?error=email');
  }

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    // Galat (termasuk email tak terdaftar) sengaja diabaikan: pesan tetap sama.
    await supabase.auth
      .resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/pemulihan` })
      .catch(() => undefined);
  }

  const outcome = passwordResetOutcome(email);
  redirect(outcome.ok ? '/lupa-sandi?terkirim=1' : '/lupa-sandi?error=umum');
}
