import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { canWriteContent } from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';
import { UsersService } from '../src/modules/users/users.service.js';

const baseProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'pendaftar@example.com',
  fullName: 'Pendaftar',
  role: 'CONTRIBUTOR',
  isActive: true,
  emailVerifiedAt: new Date(),
} as const;

const pending: AuthProfile = { ...baseProfile, accountStatus: 'PENDING' };
const rejected: AuthProfile = { ...baseProfile, accountStatus: 'REJECTED' };
const approved: AuthProfile = { ...baseProfile, accountStatus: 'APPROVED' };

const validInput = {
  type: 'ARTICLE' as const,
  title: 'Adab Menuntut Ilmu',
  excerpt: '',
  body: '<p>Isi</p>',
  transcript: '',
  mediaUrl: '',
  categoryIds: [],
  tagNames: [],
  speakerId: null,
  links: [],
};

function createContentsService() {
  const prisma = {
    content: {
      create: vi.fn().mockResolvedValue({ id: 'content-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  return {
    prisma,
    service: new ContentsService(prisma as unknown as PrismaService),
  };
}

describe('canWriteContent', () => {
  it('hanya mengizinkan akun yang disetujui', () => {
    expect(canWriteContent('APPROVED')).toBe(true);
    expect(canWriteContent('PENDING')).toBe(false);
    expect(canWriteContent('REJECTED')).toBe(false);
  });
});

describe('pembatasan konten untuk akun belum disetujui', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menolak akun PENDING membuat konten', async () => {
    const { prisma, service } = createContentsService();

    await expect(service.create(pending, validInput)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.content.create).not.toHaveBeenCalled();
  });

  it('menolak akun PENDING mengajukan review', async () => {
    const { prisma, service } = createContentsService();

    await expect(service.submit(pending, 'content-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.content.findUnique).not.toHaveBeenCalled();
  });

  it('menolak akun REJECTED membuat konten dengan pesan berbeda', async () => {
    const { service } = createContentsService();

    await expect(service.create(rejected, validInput)).rejects.toThrow(/ditolak admin/);
  });

  it('akun APPROVED tetap bisa membuat konten', async () => {
    const { prisma, service } = createContentsService();

    await service.create(approved, validInput);

    expect(prisma.content.create).toHaveBeenCalled();
  });
});

describe('keputusan admin atas status akun', () => {
  function createUsersService() {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          id: baseProfile.id,
          email: baseProfile.email,
          role: 'CONTRIBUTOR',
          accountStatus: 'PENDING',
        }),
        update: vi.fn().mockImplementation(({ data }) => ({
          ...baseProfile,
          accountStatus: data.accountStatus ?? 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
      notification: { create: vi.fn().mockResolvedValue({ id: 'notif-1' }) },
    };
    const config = { get: vi.fn(() => undefined) };

    return {
      prisma,
      service: new UsersService(
        prisma as unknown as PrismaService,
        config as unknown as ConfigService,
      ),
    };
  }

  it('menyetujui akun dan mengirim notifikasi ke pemiliknya', async () => {
    const { prisma, service } = createUsersService();

    const updated = await service.updateUser(baseProfile.id, { accountStatus: 'APPROVED' });

    expect(updated.accountStatus).toBe('APPROVED');
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: baseProfile.id,
          type: 'ACCOUNT_APPROVED',
        }),
      }),
    );
  });

  it('menolak akun memakai notifikasi penolakan', async () => {
    const { prisma, service } = createUsersService();

    await service.updateUser(baseProfile.id, { accountStatus: 'REJECTED' });

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'ACCOUNT_REJECTED' }),
      }),
    );
  });

  it('tidak mengirim notifikasi bila status tidak berubah', async () => {
    const { prisma, service } = createUsersService();
    prisma.profile.findUnique.mockResolvedValue({
      id: baseProfile.id,
      email: baseProfile.email,
      role: 'CONTRIBUTOR',
      accountStatus: 'APPROVED',
    });

    await service.updateUser(baseProfile.id, { accountStatus: 'APPROVED' });

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('akun yang dibuat admin langsung disetujui', async () => {
    const { prisma, service } = createUsersService();
    (service as unknown as { supabase: unknown }).supabase = {
      auth: {
        admin: {
          createUser: vi
            .fn()
            .mockResolvedValue({ data: { user: { id: baseProfile.id } }, error: null }),
          deleteUser: vi.fn(),
        },
      },
    };
    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.upsert = vi.fn().mockResolvedValue({
      ...baseProfile,
      accountStatus: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.createUser({
      email: 'baru@example.com',
      password: 'sandi-aman',
      fullName: 'Baru',
      role: 'CONTRIBUTOR',
    });

    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ accountStatus: 'APPROVED' }),
      }),
    );
  });
});
