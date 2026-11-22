import { describe, expect, it } from 'vitest';

import { validateSignup } from './signup';

const valid = {
  fullName: 'Ahmad Fulan',
  email: 'Ahmad@Example.com',
  password: 'rahasia123',
  passwordConfirm: 'rahasia123',
};

function errorsOf(input: Parameters<typeof validateSignup>[0]) {
  const result = validateSignup(input);

  if (result.ok) {
    throw new Error('Validasi seharusnya menolak input ini.');
  }

  return result.errors;
}

describe('validateSignup', () => {
  it('menerima data yang sah dan menormalkan email serta nama', () => {
    const result = validateSignup({ ...valid, fullName: '  Ahmad Fulan  ' });

    expect(result).toEqual({
      ok: true,
      values: { fullName: 'Ahmad Fulan', email: 'ahmad@example.com', password: 'rahasia123' },
    });
  });

  it('menerima nama lengkap kosong (opsional)', () => {
    const result = validateSignup({ ...valid, fullName: '   ' });

    expect(result.ok).toBe(true);
  });

  it('menolak email kosong atau formatnya salah', () => {
    for (const email of ['', '   ', 'tanpa-at', 'a@b', 'a b@contoh.com']) {
      expect(errorsOf({ ...valid, email })).toHaveProperty('email');
    }
  });

  it('menolak email yang terlalu panjang', () => {
    const email = `${'a'.repeat(250)}@contoh.com`;

    expect(errorsOf({ ...valid, email })).toHaveProperty('email');
  });

  it('menolak kata sandi kurang dari 8 karakter', () => {
    const errors = errorsOf({ ...valid, password: 'pendek', passwordConfirm: 'pendek' });

    expect(errors.password).toBe('Kata sandi minimal 8 karakter.');
  });

  it('menolak kata sandi lebih dari 128 karakter', () => {
    const password = 'a'.repeat(129);

    expect(errorsOf({ ...valid, password, passwordConfirm: password })).toHaveProperty('password');
  });

  it('menolak konfirmasi kata sandi yang berbeda', () => {
    const errors = errorsOf({ ...valid, passwordConfirm: 'rahasia124' });

    expect(errors.passwordConfirm).toBe('Ulangi kata sandi dengan tepat.');
    expect(errors.password).toBeUndefined();
  });

  it('menolak nama lengkap lebih dari 120 karakter', () => {
    expect(errorsOf({ ...valid, fullName: 'a'.repeat(121) })).toHaveProperty('fullName');
  });

  it('mengumpulkan semua kesalahan sekaligus', () => {
    const errors = errorsOf({ fullName: '', email: '', password: '', passwordConfirm: 'x' });

    expect(Object.keys(errors).sort()).toEqual(['email', 'password', 'passwordConfirm']);
  });
});
