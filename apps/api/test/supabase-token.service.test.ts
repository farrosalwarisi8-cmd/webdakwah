import type { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { SupabaseTokenService } from '../src/modules/auth/supabase-token.service.js';

const SUPABASE_URL = 'https://contoh.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const SECRET = 'rahasia-uji-yang-cukup-panjang-untuk-hs256';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const EMAIL = 'pengguna@example.com';

function createService(values: Record<string, string | undefined>): SupabaseTokenService {
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService;

  return new SupabaseTokenService(config);
}

async function signToken(
  overrides: {
    issuer?: string;
    audience?: string;
    email?: string | null;
    expiresIn?: string;
    secret?: string;
  } = {},
): Promise<string> {
  const payload = overrides.email === null ? {} : { email: overrides.email ?? EMAIL };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(USER_ID)
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(overrides.audience ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? '5m')
    .sign(new TextEncoder().encode(overrides.secret ?? SECRET));
}

describe('SupabaseTokenService', () => {
  it('menerima token HS256 yang sah dan mengembalikan identitas', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });

    await expect(service.verify(await signToken())).resolves.toEqual({
      id: USER_ID,
      email: EMAIL,
    });
  });

  it('menolak token dengan issuer lain', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });
    const token = await signToken({ issuer: 'https://penyerang.example/auth/v1' });

    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });

  it('menolak token dengan audience salah', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });
    const token = await signToken({ audience: 'anon' });

    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });

  it('menolak token kedaluwarsa', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });
    const token = await signToken({ expiresIn: '-1m' });

    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });

  it('menolak token yang ditandatangani kunci lain', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });
    const token = await signToken({ secret: 'kunci-palsu-yang-juga-cukup-panjang-123456' });

    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });

  it('menolak token tanpa email', async () => {
    const service = createService({ SUPABASE_URL, SUPABASE_JWT_SECRET: SECRET });
    const token = await signToken({ email: null });

    await expect(service.verify(token)).rejects.toMatchObject({ status: 401 });
  });

  it('memberi tahu bila autentikasi belum dikonfigurasi', async () => {
    const service = createService({});

    await expect(service.verify(await signToken())).rejects.toMatchObject({ status: 503 });
  });
});
