/**
 * Aturan murni untuk alur lupa kata sandi, dipisah agar bisa diuji tanpa DOM
 * maupun Supabase.
 */

/** Pesan yang selalu sama, baik email terdaftar maupun tidak. */
export const PASSWORD_RESET_SENT_MESSAGE =
  'Jika email terdaftar, tautan pengaturan kata sandi sudah dikirim. Periksa kotak masuk dan folder spam.';

export const PASSWORD_RESET_LIMIT_MESSAGE =
  'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.';

export const PASSWORD_RESET_EXPIRED_MESSAGE =
  'Tautan pengaturan kata sandi tidak valid atau sudah kedaluwarsa. Minta tautan baru.';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);

  return email.length > 0 && email.length <= 254 && EMAIL_PATTERN.test(email);
}

/**
 * Hasil permintaan reset. Email sengaja tidak memengaruhi hasil apa pun:
 * keberadaan akun tidak boleh bocor lewat pesan, kode status, atau durasi.
 */
export function passwordResetOutcome(email: string): { ok: true; message: string } {
  void email;

  return { ok: true, message: PASSWORD_RESET_SENT_MESSAGE };
}

/** Kunci pembatas laju; header proxy dipakai bila tersedia. */
export function requestKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const candidate =
    (forwarded ? forwarded.split(',')[0]?.trim() : null) ?? headers.get('x-real-ip')?.trim();

  return candidate && candidate.length > 0 ? candidate : 'tanpa-ip';
}
