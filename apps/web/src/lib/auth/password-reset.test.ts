import { describe, expect, it } from 'vitest';

import {
  isValidEmail,
  normalizeEmail,
  PASSWORD_RESET_SENT_MESSAGE,
  passwordResetOutcome,
  requestKeyFromHeaders,
} from './password-reset';

describe('passwordResetOutcome', () => {
  it('memberi pesan yang sama untuk email apa pun', () => {
    const registered = passwordResetOutcome('kontributor@example.com');
    const unknown = passwordResetOutcome('tidak-terdaftar@example.com');

    expect(registered).toEqual(unknown);
    expect(registered.message).toBe(PASSWORD_RESET_SENT_MESSAGE);
    expect(registered.message.toLowerCase()).not.toContain('tidak terdaftar');
  });
});

describe('email pemulihan', () => {
  it('menormalkan spasi dan huruf', () => {
    expect(normalizeEmail('  Nama@Email.COM ')).toBe('nama@email.com');
  });

  it('menerima email wajar dan menolak yang cacat', () => {
    expect(isValidEmail('nama@email.com')).toBe(true);
    expect(isValidEmail('nama@email')).toBe(false);
    expect(isValidEmail('nama email.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(`${'a'.repeat(250)}@email.com`)).toBe(false);
  });
});

describe('requestKeyFromHeaders', () => {
  it('memakai IP pertama dari x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });

    expect(requestKeyFromHeaders(headers)).toBe('203.0.113.5');
  });

  it('jatuh ke x-real-ip lalu ke kunci cadangan', () => {
    expect(requestKeyFromHeaders(new Headers({ 'x-real-ip': '198.51.100.7' }))).toBe(
      '198.51.100.7',
    );
    expect(requestKeyFromHeaders(new Headers())).toBe('tanpa-ip');
  });
});
