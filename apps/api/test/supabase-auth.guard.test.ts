import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { IS_PUBLIC_KEY } from '../src/modules/auth/auth.decorators.js';
import { SupabaseAuthGuard, readBearerToken } from '../src/modules/auth/supabase-auth.guard.js';
import type { SupabaseTokenService } from '../src/modules/auth/supabase-token.service.js';

interface FakeRequest {
  headers: Record<string, string | undefined>;
  user?: { id: string; email: string };
}

function createContext(request: FakeRequest, handler: () => void = () => {}): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(verify: ReturnType<typeof vi.fn>): SupabaseAuthGuard {
  return new SupabaseAuthGuard(new Reflector(), {
    verify,
  } as unknown as SupabaseTokenService);
}

describe('readBearerToken', () => {
  it('menerima skema Bearer tanpa peduli huruf besar/kecil', () => {
    expect(readBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(readBearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('menolak header kosong atau skema lain', () => {
    expect(readBearerToken(undefined)).toBeNull();
    expect(readBearerToken('Basic abc')).toBeNull();
    expect(readBearerToken('Bearer')).toBeNull();
  });
});

describe('SupabaseAuthGuard', () => {
  it('menolak permintaan tanpa token', async () => {
    const guard = createGuard(vi.fn());

    await expect(guard.canActivate(createContext({ headers: {} }))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('menolak token yang gagal diverifikasi', async () => {
    const verify = vi.fn().mockRejectedValue(new Error('invalid signature'));
    const guard = createGuard(verify);

    await expect(
      guard.canActivate(createContext({ headers: { authorization: 'Bearer rusak' } })),
    ).rejects.toThrow();
  });

  it('melampirkan identitas dari token yang valid', async () => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.com' };
    const guard = createGuard(vi.fn().mockResolvedValue(user));
    const request: FakeRequest = { headers: { authorization: 'Bearer token-valid' } };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('membiarkan rute publik tanpa token', async () => {
    const verify = vi.fn();
    const guard = createGuard(verify);
    const handler = () => {};
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);

    await expect(guard.canActivate(createContext({ headers: {} }, handler))).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });
});
