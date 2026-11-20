import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { BroadcastWatchingService } from '../src/modules/broadcast/broadcast-watching.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const CHANNEL_ID = '99999999-9999-4999-8999-999999999999';

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
    liveStream: {
      findUnique: vi.fn().mockResolvedValue({ id: CHANNEL_ID, isEnabled: true }),
    },
    broadcastWatching: {
      upsert: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(3),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  return {
    prisma,
    service: new BroadcastWatchingService(prisma as unknown as PrismaService),
  };
}

describe('BroadcastWatchingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mengizinkan kontributor mengikuti siaran aktif tanpa duplikasi baris', async () => {
    const { prisma, service } = createService();

    await expect(service.watch(contributor, CHANNEL_ID)).resolves.toEqual({
      watching: true,
      watcherCount: 3,
    });
    expect(prisma.broadcastWatching.upsert).toHaveBeenCalledWith({
      where: { profileId_channelId: { profileId: contributor.id, channelId: CHANNEL_ID } },
      create: { profileId: contributor.id, channelId: CHANNEL_ID },
      update: {},
    });
  });

  it('menolak mengikuti channel yang tidak ada atau belum aktif', async () => {
    const { prisma, service } = createService();

    prisma.liveStream.findUnique.mockResolvedValueOnce(null);
    await expect(service.watch(contributor, CHANNEL_ID)).rejects.toBeInstanceOf(NotFoundException);

    prisma.liveStream.findUnique.mockResolvedValueOnce({ id: CHANNEL_ID, isEnabled: false });
    await expect(service.watch(contributor, CHANNEL_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.broadcastWatching.upsert).not.toHaveBeenCalled();
  });

  it('berhenti mengikuti hanya untuk profil dan channel milik pemanggil', async () => {
    const { prisma, service } = createService();

    await expect(service.unwatch(contributor, CHANNEL_ID)).resolves.toEqual({
      watching: false,
      watcherCount: 3,
    });
    expect(prisma.broadcastWatching.deleteMany).toHaveBeenCalledWith({
      where: { profileId: contributor.id, channelId: CHANNEL_ID },
    });
  });

  it('mengembalikan status ikut siaran pengguna', async () => {
    const { prisma, service } = createService();

    await expect(service.status(contributor, CHANNEL_ID)).resolves.toEqual({
      watching: false,
      watcherCount: 3,
    });

    prisma.broadcastWatching.findUnique.mockResolvedValueOnce({ id: 'row-1' });
    await expect(service.status(contributor, CHANNEL_ID)).resolves.toEqual({
      watching: true,
      watcherCount: 3,
    });
  });

  it('menolak kontributor melihat daftar pengikut (403)', async () => {
    const { prisma, service } = createService();

    await expect(service.listWatchers(contributor, CHANNEL_ID, 1, 12)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.broadcastWatching.findMany).not.toHaveBeenCalled();
  });

  it('memberi admin daftar pengikut tanpa field internal profil', async () => {
    const { prisma, service } = createService();
    prisma.broadcastWatching.findMany.mockResolvedValue([
      {
        id: 'row-1',
        profileId: contributor.id,
        createdAt: new Date('2026-11-19T02:00:00Z'),
        profile: { fullName: 'Kontributor', email: contributor.email },
      },
    ]);
    prisma.broadcastWatching.count.mockResolvedValue(1);

    const result = await service.listWatchers(admin, CHANNEL_ID, 1, 12);

    expect(result).toEqual({
      items: [
        {
          id: 'row-1',
          profileId: contributor.id,
          fullName: 'Kontributor',
          email: contributor.email,
          createdAt: '2026-11-19T02:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 12,
      total: 1,
      totalPages: 1,
    });
  });
});
