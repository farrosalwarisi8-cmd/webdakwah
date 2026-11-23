import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const CONTENT_ID = '66666666-6666-4666-8666-666666666666';

const admin: AuthProfile = {
  id: '44444444-4444-4444-8444-444444444444',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'ADMIN',
  isActive: true,
  accountStatus: 'APPROVED',
};

const contributor: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'kontributor@example.com',
  fullName: 'Kontributor',
  role: 'CONTRIBUTOR',
  isActive: true,
  accountStatus: 'APPROVED',
};

function createService() {
  const prisma = {
    content: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({ id: CONTENT_ID }),
    },
  };

  return {
    prisma,
    service: new ContentsService(prisma as unknown as PrismaService),
  };
}

describe('ContentsService — kelola terbitan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menolak kontributor melihat daftar terbitan', async () => {
    const { prisma, service } = createService();

    await expect(
      service.listManaged(contributor, { page: 1, pageSize: 12, status: 'PUBLISHED' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.content.findMany).not.toHaveBeenCalled();
  });

  it('menampilkan terbitan terbaru sesuai status yang diminta', async () => {
    const { prisma, service } = createService();
    prisma.content.count.mockResolvedValue(5);

    const result = await service.listManaged(admin, {
      page: 1,
      pageSize: 12,
      status: 'ARCHIVED',
    });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ARCHIVED' },
        orderBy: { publishedAt: 'desc' },
      }),
    );
    expect(result).toMatchObject({ total: 5, totalPages: 1 });
  });

  it('mengarsipkan konten yang sudah terbit tanpa menghapus publishedAt', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'PUBLISHED' });

    await service.archive(admin, CONTENT_ID);

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONTENT_ID },
        data: { status: 'ARCHIVED' },
      }),
    );
  });

  it('menolak mengarsipkan konten yang belum terbit', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'PENDING_REVIEW' });

    await expect(service.archive(admin, CONTENT_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('memulihkan konten arsip ke terbit', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'ARCHIVED' });

    await service.unarchive(admin, CONTENT_ID);

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONTENT_ID },
        data: { status: 'PUBLISHED' },
      }),
    );
  });

  it('menolak memulihkan konten yang tidak diarsipkan', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'PUBLISHED' });

    await expect(service.unarchive(admin, CONTENT_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('menolak kontributor mengarsipkan konten', async () => {
    const { prisma, service } = createService();

    await expect(service.archive(contributor, CONTENT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.content.findUnique).not.toHaveBeenCalled();
  });

  it('memberi 404 saat konten yang dikelola tidak ditemukan', async () => {
    const { service } = createService();

    await expect(service.archive(admin, CONTENT_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
