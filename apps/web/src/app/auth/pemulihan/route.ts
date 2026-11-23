import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Tujuan tautan pemulihan kata sandi dari Supabase.
 *
 * Mendukung dua bentuk seperti /auth/konfirmasi:
 * - `?token_hash=...&type=recovery` (template email kustom);
 * - `?code=...` (tautan bawaan dengan alur PKCE).
 *
 * Bila sesi pemulihan berhasil dibentuk, pengunjung diarahkan ke /atur-sandi
 * untuk mengetik sandi baru. Tautan yang rusak/kedaluwarsa diarahkan ke
 * halaman yang sama dengan penanda gagal, tanpa detail teknis.
 */

const RECOVERY_TYPES: readonly EmailOtpType[] = ['recovery', 'email'];

function isRecoveryType(value: string | null): boolean {
  return value === null || RECOVERY_TYPES.includes(value as EmailOtpType);
}

function destination(request: NextRequest, ok: boolean) {
  const url = request.nextUrl.clone();
  url.pathname = '/atur-sandi';
  url.search = '';
  url.searchParams.set(ok ? 'siap' : 'gagal', '1');

  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const code = request.nextUrl.searchParams.get('code');
  const type = request.nextUrl.searchParams.get('type');

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(destination(request, false));
  }

  if (tokenHash) {
    if (!isRecoveryType(type)) {
      return NextResponse.redirect(destination(request, false));
    }

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });

    return NextResponse.redirect(destination(request, !error));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    return NextResponse.redirect(destination(request, !error));
  }

  return NextResponse.redirect(destination(request, false));
}
