import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { can, hasAnyRole, permissionsFor, type Role } from '@webdakwah/shared';

import { ROLES_KEY } from '../src/modules/auth/auth.decorators.js';
import { RolesGuard } from '../src/modules/auth/roles.guard.js';
import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

interface FakeRequest {
  headers: Record<string, string | undefined>;
  user?: { id: string; email: string };
  profile?: AuthProfile;
}

function createContext(request: FakeRequest, handler: () => void = () => {}): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(findUnique: ReturnType<typeof vi.fn>): RolesGuard {
  const prisma = { profile: { findUnique } } as unknown as PrismaService;
  // Reflector asli: guard membaca metadata yang dipasang @Roles.
  return new RolesGuard(new Reflector(), prisma);
}

const profile = (role: Role, isActive = true): AuthProfile => ({
  id: '11111111-1111-4111-8111-111111111111',
  email: 'pengguna@example.com',
  fullName: 'Pengguna Uji',
  role,
  isActive,
});

describe('matriks izin', () => {
  it('memberi kontributor akses membuat dan menyunting tulisannya sendiri', () => {
    expect(can('CONTRIBUTOR', 'content:create')).toBe(true);
    expect(can('CONTRIBUTOR', 'content:update-own')).toBe(true);
    expect(permissionsFor('CONTRIBUTOR')).toHaveLength(2);
  });

  it('menolak kontributor menerbitkan, menghapus, atau mengelola pengguna', () => {
    expect(can('CONTRIBUTOR', 'content:publish')).toBe(false);
    expect(can('CONTRIBUTOR', 'content:delete-any')).toBe(false);
    expect(can('CONTRIBUTOR', 'users:manage')).toBe(false);
  });

  it('memberi admin seluruh izin', () => {
    expect(can('ADMIN', 'content:publish')).toBe(true);
    expect(can('ADMIN', 'content:delete-any')).toBe(true);
    expect(can('ADMIN', 'users:manage')).toBe(true);
    expect(can('ADMIN', 'broadcast:manage')).toBe(true);
    expect(permissionsFor('ADMIN')).toHaveLength(7);
  });

  it('mencocokkan role yang diizinkan secara eksak', () => {
    expect(hasAnyRole('ADMIN', ['ADMIN'])).toBe(true);
    expect(hasAnyRole('CONTRIBUTOR', ['ADMIN'])).toBe(false);
  });
});

describe('RolesGuard', () => {
  it('menolak permintaan tanpa identitas terverifikasi', async () => {
    const guard = createGuard(vi.fn());
    await expect(guard.canActivate(createContext({ headers: {} }))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('menolak pengguna yang belum punya profil', async () => {
    const guard = createGuard(vi.fn().mockResolvedValue(null));
    await expect(
      guard.canActivate(
        createContext({ headers: {}, user: { id: 'abc', email: 'abc@example.com' } }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('menolak akun yang dinonaktifkan walau tokennya valid', async () => {
    const guard = createGuard(vi.fn().mockResolvedValue(profile('ADMIN', false)));
    await expect(
      guard.canActivate(
        createContext({ headers: {}, user: { id: 'abc', email: 'abc@example.com' } }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('menolak kontributor pada rute khusus admin', async () => {
    const guard = createGuard(vi.fn().mockResolvedValue(profile('CONTRIBUTOR')));
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);

    await expect(
      guard.canActivate(
        createContext({ headers: {}, user: { id: 'abc', email: 'abc@example.com' } }, handler),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('mengizinkan admin dan melampirkan profil ke request', async () => {
    const admin = profile('ADMIN');
    const guard = createGuard(vi.fn().mockResolvedValue(admin));
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, ['ADMIN'], handler);
    const request: FakeRequest = { headers: {}, user: { id: admin.id, email: admin.email } };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
    expect(request.profile).toEqual(admin);
  });

  it('mengizinkan rute tanpa batasan role setelah profil dimuat', async () => {
    const guard = createGuard(vi.fn().mockResolvedValue(profile('CONTRIBUTOR')));
    await expect(
      guard.canActivate(
        createContext({ headers: {}, user: { id: 'abc', email: 'abc@example.com' } }),
      ),
    ).resolves.toBe(true);
  });
});
