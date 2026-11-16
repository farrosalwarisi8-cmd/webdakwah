import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../src/modules/prisma/prisma.service.js';
import { PublicContentsService } from '../src/modules/public/public-contents.service.js';

const PUBLISHED_ITEM = {
  id: '55555555-5555-4555-8555-555555555555',
  type: 'ARTICLE',
  title: 'Menuntut ilmu itu ibadah',
  slug: 'menuntut-ilmu-itu-ibadah-a1b2c3',
  excerpt: 'Ringkasan singkat.',
  mediaUrl: null,
  publishedAt: new Date('2026-11-15T03:00:00Z'),
  author: { fullName: 'Penulis' },
};

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

describe('PublicContentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hanya mengambil konten PUBLISHED, urut terbaru, dengan paginasi', async () => {
    const { prisma, service } = createService();
    prisma.content.count.mockResolvedValue(13);

    const result = await service.list({ page: 2, pageSize: 12 });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        skip: 12,
        take: 12,
      }),
    );
    expect(result).toMatchObject({ total: 13, totalPages: 2 });
  });

  it('menyaring berdasarkan jenis konten', async () => {
    const { prisma, service } = createService();

    await service.list({ page: 1, pageSize: 12, type: 'AUDIO' });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED', type: 'AUDIO' } }),
    );
  });

  it('tidak pernah memilih email penulis atau data review untuk publik', async () => {
    const { prisma, service } = createService();

    await service.list({ page: 1, pageSize: 12 });

    const select = prisma.content.findMany.mock.calls[0]?.[0]?.select as {
      author: { select: Record<string, boolean> };
    };

    expect(select.author.select).toEqual({ fullName: true });
    expect(select).not.toHaveProperty('reviewNote');
    expect(select).not.toHaveProperty('status');
  });

  it('mengambil detail berdasarkan slug yang sudah terbit', async () => {
    const { prisma, service } = createService();
    prisma.content.findFirst.mockResolvedValue({ ...PUBLISHED_ITEM, body: 'Isi artikel' });

    const result = await service.getBySlug(PUBLISHED_ITEM.slug);

    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: PUBLISHED_ITEM.slug, status: 'PUBLISHED' },
      }),
    );
    expect(result).toMatchObject({ slug: PUBLISHED_ITEM.slug, body: 'Isi artikel' });
  });

  it('memberi 404 bila slug tidak ada atau belum terbit', async () => {
    const { service } = createService();

    await expect(service.getBySlug('tidak-ada')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('mengambil daftar konten terbaru lintas jenis dengan batas jumlah', async () => {
    const { prisma, service } = createService();
    prisma.content.findMany.mockResolvedValue([PUBLISHED_ITEM]);

    const result = await service.latest(5);

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('mengambil satu terbitan terbaru per jenis untuk beranda', async () => {
    const { prisma, service } = createService();
    prisma.content.findFirst.mockImplementation(({ where }: { where: { type: string } }) =>
      Promise.resolve(where.type === 'ARTICLE' ? PUBLISHED_ITEM : null),
    );

    const result = await service.highlights();

    expect(prisma.content.findFirst).toHaveBeenCalledTimes(4);
    expect(result.ARTICLE).toMatchObject({ slug: PUBLISHED_ITEM.slug });
    expect(result.AUDIO).toBeNull();
  });
});
