import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';
import { UploadQuotaService } from '../src/modules/uploads/upload-quota.service.js';

const contributorA: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@example.com',
  fullName: 'Kontributor A',
  role: 'CONTRIBUTOR',
  isActive: true,
  accountStatus: 'APPROVED',
};

const contributorB: AuthProfile = {
  ...contributorA,
  id: '22222222-2222-4222-8222-222222222222',
  email: 'b@example.com',
};

const admin: AuthProfile = {
  ...contributorA,
  id: '33333333-3333-4333-8333-333333333333',
  role: 'ADMIN',
};

function createService() {
  // Setiap pemanggilan count mengambil angka berikutnya untuk pengguna itu:
  // [jam, hari]. Pemisahan per pengguna diuji lewat kunci profileId.
  const queues = new Map<string, number[]>();

  const count = vi.fn((args: { where: { profileId: string } }) => {
    const queue = queues.get(args.where.profileId) ?? [];
    const value = queue.shift();

    return Promise.resolve(value ?? 0);
  });

  const prisma = {
    uploadRequestLog: {
      count,
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const config = {
    get: vi.fn((key: string, fallback: number) => fallback),
  };

  return {
    queues,
    prisma,
    service: new UploadQuotaService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    ),
  };
}

describe('UploadQuotaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menolak setelah 20 unggahan dalam satu jam dan pengguna lain tetap boleh', async () => {
    const { queues, service } = createService();
    queues.set(contributorA.id, [20]);
    queues.set(contributorB.id, [0, 0]);

    await expect(service.assertAllowed(contributorA)).rejects.toMatchObject({
      status: 429,
    });
    await expect(service.assertAllowed(contributorB)).resolves.toBeUndefined();
  });

  it('menolak saat kuota harian tercapai walau kuota jam masih tersisa', async () => {
    const { queues, service } = createService();
    queues.set(contributorA.id, [19, 60]);

    await expect(service.assertAllowed(contributorA)).rejects.toBeInstanceOf(HttpException);
  });

  it('admin memakai batas jam lebih tinggi dan bebas kuota harian', async () => {
    const { prisma, queues, service } = createService();
    queues.set(admin.id, [99]);

    await expect(service.assertAllowed(admin)).resolves.toBeUndefined();
    // Hanya satu query (jam); kuota harian tidak diperiksa untuk admin.
    expect(prisma.uploadRequestLog.count).toHaveBeenCalledTimes(1);
  });

  it('mencatat presign dan membersihkan catatan lebih dari 48 jam', async () => {
    const { prisma, service } = createService();

    await service.record(contributorA.id);

    expect(prisma.uploadRequestLog.create).toHaveBeenCalledWith({
      data: { profileId: contributorA.id },
    });
    expect(prisma.uploadRequestLog.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdAt: { lt: expect.any(Date) } },
      }),
    );
  });

  it('kegagalan pembersihan tidak menggagalkan presign', async () => {
    const { prisma, service } = createService();
    prisma.uploadRequestLog.deleteMany.mockRejectedValue(new Error('database sibuk'));

    await expect(service.record(contributorA.id)).resolves.toBeUndefined();
  });
});
