import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@webdakwah/shared';

/**
 * Validasi pendaftaran mandiri kontributor. Dipisah dari komponen agar aturan
 * yang sama bisa diuji tanpa DOM dan konsisten dengan `userCreateSchema` di
 * packages/shared (sandi 8–128 karakter, nama maksimal 120 karakter).
 */

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export type SignupField = 'fullName' | 'email' | 'password' | 'passwordConfirm';

export type SignupErrors = Partial<Record<SignupField, string>>;

export interface SignupValues {
  fullName: string;
  email: string;
  password: string;
}

export type SignupValidation =
  { ok: true; values: SignupValues } | { ok: false; errors: SignupErrors };

/** Cek longgar: cukup satu `@` dan ada titik di domain, tanpa spasi. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };

export const FULL_NAME_MAX_LENGTH = 120;

export function validateSignup(input: SignupInput): SignupValidation {
  const errors: SignupErrors = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!email) {
    errors.email = 'Email wajib diisi.';
  } else if (email.length > 254) {
    errors.email = 'Email terlalu panjang.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  if (input.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  } else if (input.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter.`;
  }

  if (input.passwordConfirm !== input.password) {
    errors.passwordConfirm = 'Ulangi kata sandi dengan tepat.';
  }

  if (fullName.length > FULL_NAME_MAX_LENGTH) {
    errors.fullName = `Nama lengkap maksimal ${FULL_NAME_MAX_LENGTH} karakter.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, values: { fullName, email, password: input.password } };
}
