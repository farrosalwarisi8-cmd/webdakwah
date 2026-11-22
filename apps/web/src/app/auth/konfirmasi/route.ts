import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Tujuan tautan verifikasi email pendaftaran.
 *
 * Mendukung dua bentuk tautan Supabase:
 * - `?token_hash=...&type=signup` (template email kustom, bisa dibuka di
 *   perangkat lain karena tidak bergantung cookie PKCE);
 * - `?code=...` (ConfirmationURL bawaan yang memakai alur PKCE).
 *
 * Setelah sesi terbentuk, kolom `profiles.email_verified_at` diisi trigger
 * database; halaman ini tidak menulis profil sendiri.
 */

const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

function resultUrl(request: NextRequest, status: 'berhasil' | 'gagal') {
  const url = request.nextUrl.clone();
  url.pathname = '/masuk';
  url.search = '';
  url.searchParams.set('konfirmasi', status);

  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const code = request.nextUrl.searchParams.get('code');
  const type = request.nextUrl.searchParams.get('type');

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(resultUrl(request, 'gagal'));
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: isOtpType(type) ? type : 'signup',
    });

    return NextResponse.redirect(resultUrl(request, error ? 'gagal' : 'berhasil'));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    return NextResponse.redirect(resultUrl(request, error ? 'gagal' : 'berhasil'));
  }

  return NextResponse.redirect(resultUrl(request, 'gagal'));
}
