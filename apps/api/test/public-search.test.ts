import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../src/modules/prisma/prisma.service.js';
import { PublicContentsService } from '../src/modules/public/public-contents.service.js';

function createService() {
  const prisma = {
    content: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };

  return {
    prisma,
    service: new PublicContentsService(prisma as unknown as PrismaService),
  };
}

describe('PublicContentsService.search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mencari di judul, ringkasan, dan isi; hanya konten PUBLISHED', async () => {
    const { prisma, service } = createService();

    await service.search({ q: 'ilmu', page: 1, pageSize: 12 });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: 'ilmu', mode: 'insensitive' } },
            { excerpt: { contains: 'ilmu', mode: 'insensitive' } },
            { body: { contains: 'ilmu', mode: 'insensitive' } },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 12,
      }),
    );
  });

  it('menggabungkan filter jenis dan paginasi', async () => {
    const { prisma, service } = createService();

    await service.search({ q: 'kajian', type: 'AUDIO', page: 2, pageSize: 12 });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED', type: 'AUDIO' }),
        skip: 12,
      }),
    );
  });

  it('mengembalikan total dan jumlah halaman dari hasil pencarian', async () => {
    const { prisma, service } = createService();
    prisma.content.count.mockResolvedValue(13);

    const result = await service.search({ q: 'ilmu', page: 2, pageSize: 12 });

    expect(result).toMatchObject({ total: 13, totalPages: 2, page: 2 });
  });

  it('tidak memilih email penulis atau data review', async () => {
    const { prisma, service } = createService();

    await service.search({ q: 'ilmu', page: 1, pageSize: 12 });

    const select = prisma.content.findMany.mock.calls[0]?.[0]?.select as {
      author: { select: Record<string, boolean> };
    };

    expect(select.author.select).toEqual({ fullName: true });
    expect(select).not.toHaveProperty('reviewNote');
    expect(select).not.toHaveProperty('status');
  });
});
