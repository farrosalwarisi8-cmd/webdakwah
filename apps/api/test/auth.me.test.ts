import { BadRequestException } from '@nestjs/common';
import { passwordSchema, profileUpdateSchema } from '@webdakwah/shared';
import { describe, expect, it, vi } from 'vitest';

import { AuthController } from '../src/modules/auth/auth.controller.js';
import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { MeService } from '../src/modules/auth/me.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const contributor: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'kontributor@example.com',
  fullName: 'Nama Lama',
  role: 'CONTRIBUTOR',
  isActive: true,
  emailVerifiedAt: null,
};

function createController() {
  const me = { updateProfile: vi.fn() };
  const controller = new AuthController(me as unknown as MeService);

  return { me, controller };
}

describe('profileUpdateSchema', () => {
  it('memangkas spasi nama', () => {
    expect(profileUpdateSchema.parse({ fullName: '  Nama Baru  ' })).toEqual({
      fullName: 'Nama Baru',
    });
  });

  it('menolak upaya mengubah role atau status', () => {
    expect(() => profileUpdateSchema.parse({ fullName: 'X', role: 'ADMIN' })).toThrow();
    expect(() => profileUpdateSchema.parse({ fullName: 'X', isActive: false })).toThrow();
  });

  it('menolak nama kosong', () => {
    expect(() => profileUpdateSchema.parse({ fullName: '   ' })).toThrow();
  });
});

describe('passwordSchema', () => {
  it('menerima sandi 8–128 karakter', () => {
    expect(passwordSchema.parse('sandi-aman')).toBe('sandi-aman');
    expect(passwordSchema.parse('a'.repeat(128))).toHaveLength(128);
  });

  it('menolak sandi terlalu pendek atau terlalu panjang', () => {
    expect(() => passwordSchema.parse('pendek')).toThrow('minimal 8');
    expect(() => passwordSchema.parse('a'.repeat(129))).toThrow();
  });
});

describe('PATCH /me', () => {
  it('hanya mengirim nama ke service, bukan role', async () => {
    const { me, controller } = createController();
    me.updateProfile.mockResolvedValue({ ...contributor, fullName: 'Nama Baru' });

    await controller.update(contributor, { fullName: '  Nama Baru  ' });

    expect(me.updateProfile).toHaveBeenCalledWith(contributor.id, { fullName: 'Nama Baru' });
  });

  it('menolak body yang mencoba menaikkan role', () => {
    const { me, controller } = createController();

    expect(() => controller.update(contributor, { fullName: 'X', role: 'ADMIN' })).toThrow(
      BadRequestException,
    );
    expect(me.updateProfile).not.toHaveBeenCalled();
  });
});

describe('MeService', () => {
  it('memetakan profil yang hilang menjadi 404', async () => {
    const prisma = {
      profile: { update: vi.fn().mockRejectedValue(new Error('record not found')) },
    };
    const service = new MeService(prisma as unknown as PrismaService);

    await expect(
      service.updateProfile(contributor.id, { fullName: 'Nama Baru' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('mengembalikan bentuk profil yang sama dengan GET /me', async () => {
    const updated = { ...contributor, fullName: 'Nama Baru' };
    const prisma = { profile: { update: vi.fn().mockResolvedValue(updated) } };
    const service = new MeService(prisma as unknown as PrismaService);

    await expect(service.updateProfile(contributor.id, { fullName: 'Nama Baru' })).resolves.toEqual(
      updated,
    );
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: contributor.id },
        data: { fullName: 'Nama Baru' },
      }),
    );
  });
});
