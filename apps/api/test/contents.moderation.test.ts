import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const CONTENT_ID = '33333333-3333-4333-8333-333333333333';

const admin: AuthProfile = {
  id: '44444444-4444-4444-8444-444444444444',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'ADMIN',
  isActive: true,
};

const contributor: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'kontributor@example.com',
  fullName: 'Kontributor',
  role: 'CONTRIBUTOR',
  isActive: true,
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

describe('ContentsService — moderasi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menolak kontributor melihat antrean review', async () => {
    const { prisma, service } = createService();

    await expect(
      service.listReviewQueue(contributor, { page: 1, pageSize: 12 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.content.findMany).not.toHaveBeenCalled();
  });

  it('menampilkan antrean pending dari yang paling lama menunggu', async () => {
    const { prisma, service } = createService();
    prisma.content.count.mockResolvedValue(3);

    const result = await service.listReviewQueue(admin, { page: 1, pageSize: 12 });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { updatedAt: 'asc' },
        skip: 0,
        take: 12,
      }),
    );
    expect(result).toMatchObject({ total: 3, totalPages: 1 });
  });

  it('menerbitkan konten yang menunggu review dan mengisi publishedAt', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'PENDING_REVIEW' });

    await service.publish(admin, CONTENT_ID);

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONTENT_ID },
        data: {
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
          reviewNote: null,
        },
      }),
    );
  });

  it('menolak menerbitkan konten yang bukan dalam antrean', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'DRAFT' });

    await expect(service.publish(admin, CONTENT_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('menolak kontributor menerbitkan konten', async () => {
    const { prisma, service } = createService();

    await expect(service.publish(contributor, CONTENT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.content.findUnique).not.toHaveBeenCalled();
  });

  it('menolak konten dengan catatan review yang sah', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue({ id: CONTENT_ID, status: 'PENDING_REVIEW' });

    await service.reject(admin, CONTENT_ID, 'Tambahkan sumber rujukan yang jelas.');

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: 'REJECTED',
          reviewNote: 'Tambahkan sumber rujukan yang jelas.',
        },
      }),
    );
  });

  it('menolak penolakan tanpa catatan yang memadai', async () => {
    const { prisma, service } = createService();

    await expect(service.reject(admin, CONTENT_ID, 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('memberi 404 saat konten moderasi tidak ditemukan', async () => {
    const { service } = createService();

    await expect(service.publish(admin, CONTENT_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
