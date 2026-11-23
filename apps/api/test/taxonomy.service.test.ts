import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { tagNameSchema, tagNamesSchema } from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { TaxonomyService } from '../src/modules/taxonomy/taxonomy.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

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
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'cat-1', name: 'Fiqih', slug: 'fiqih' }),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    tag: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'tag-1', name: 'adab', slug: 'adab' }),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
    },
    speaker: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'sp-1', name: 'Ustadz A', slug: 'ustadz-a' }),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    contentTag: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    contentCategory: {
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    content: {
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  };

  return {
    prisma,
    service: new TaxonomyService(prisma as unknown as PrismaService),
  };
}

describe('tagNameSchema', () => {
  it('menormalisasi huruf, spasi, dan awalan #', () => {
    expect(tagNameSchema.parse('  #Adab  Menuntut   Ilmu  ')).toBe('adab menuntut ilmu');
  });

  it('membuang duplikat yang hanya berbeda huruf besar-kecil', () => {
    expect(tagNamesSchema.parse(['Adab', 'adab', '  AKHLAK  '])).toEqual(['adab', 'akhlak']);
  });

  it('menolak tag di luar rentang 2-30 karakter', () => {
    expect(() => tagNameSchema.parse('a')).toThrow();
    expect(() => tagNameSchema.parse('a'.repeat(31))).toThrow();
  });
});

describe('TaxonomyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menolak kontributor mengelola kategori', () => {
    const { service } = createService();

    expect(() => service.assertManager(contributor)).toThrow(ForbiddenException);
  });

  it('mengizinkan admin mengelola kategori', () => {
    const { service } = createService();

    expect(() => service.assertManager(admin)).not.toThrow();
  });

  it('memberi slug cadangan unik untuk tag non-Latin', async () => {
    const { prisma, service } = createService();
    prisma.tag.findUnique.mockResolvedValue(null);
    prisma.tag.count.mockResolvedValue(0);
    prisma.tag.create.mockResolvedValue({ id: 'tag-2', name: 'العلم', slug: 'tag-abc' });

    const [tag] = await service.upsertTags(['العلم']);

    expect(prisma.tag.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'العلم',
          slug: expect.stringMatching(/^tag-/),
        }),
      }),
    );
    expect(tag.slug).toMatch(/^tag-/);
  });

  it('hanya menampilkan tag yang terhubung ke konten terbit', async () => {
    const { prisma, service } = createService();

    await service.listPublicTags();

    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contents: { some: { content: { status: 'PUBLISHED' } } } },
      }),
    );
  });

  it('merge tag memindahkan relasi tanpa duplikasi', async () => {
    const { prisma, service } = createService();
    prisma.tag.findUnique
      .mockResolvedValueOnce({ id: 'source' })
      .mockResolvedValueOnce({ id: 'target' });

    const tx = {
      contentTag: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ contentId: 'c1' }, { contentId: 'c2' }])
          .mockResolvedValueOnce([{ contentId: 'c1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      tag: {
        delete: vi.fn().mockResolvedValue({ id: 'source' }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: (tx: typeof tx) => unknown) =>
      callback(tx),
    );

    await service.mergeTag('source', 'target');

    expect(tx.contentTag.updateMany).toHaveBeenCalledWith({
      where: { tagId: 'source', contentId: { in: ['c2'] } },
      data: { tagId: 'target' },
    });
    expect(tx.contentTag.deleteMany).toHaveBeenCalledWith({ where: { tagId: 'source' } });
    expect(tx.tag.delete).toHaveBeenCalledWith({ where: { id: 'source' } });
  });

  it('membersihkan tag yatim dan melaporkan jumlahnya', async () => {
    const { prisma, service } = createService();
    prisma.tag.deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.cleanupOrphanTags()).resolves.toEqual({ deleted: 2 });
    expect(prisma.tag.deleteMany).toHaveBeenCalledWith({
      where: { contents: { none: {} } },
    });
  });

  it('tidak menggagalkan aksi utama saat pembersihan tag yatim error', async () => {
    const { prisma, service } = createService();
    prisma.tag.deleteMany.mockRejectedValue(new Error('db down'));

    await expect(service.cleanupOrphanTags()).resolves.toEqual({ deleted: 0 });
  });

  it('menghitung konten terbit terpisah dari total konten kategori', async () => {
    const { prisma, service } = createService();
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Fiqih', slug: 'fiqih', _count: { contents: 5 } },
      { id: 'cat-2', name: 'Aqidah', slug: 'aqidah', _count: { contents: 0 } },
    ]);
    prisma.contentCategory.groupBy.mockResolvedValue([
      { categoryId: 'cat-1', _count: { _all: 3 } },
    ]);

    const [fiqih, aqidah] = await service.listCategories();

    expect(prisma.contentCategory.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { content: { status: 'PUBLISHED' } } }),
    );
    expect(fiqih).toMatchObject({ publishedCount: 3, totalCount: 5 });
    expect(fiqih).not.toHaveProperty('_count');
    expect(aqidah).toMatchObject({ publishedCount: 0, totalCount: 0 });
  });

  it('menghitung konten terbit per tag', async () => {
    const { prisma, service } = createService();
    prisma.tag.findMany.mockResolvedValue([
      { id: 'tag-1', name: 'adab', slug: 'adab', _count: { contents: 2 } },
    ]);
    prisma.contentTag.groupBy.mockResolvedValue([{ tagId: 'tag-1', _count: { _all: 1 } }]);

    const [tag] = await service.listTags();

    expect(tag).toMatchObject({ publishedCount: 1, totalCount: 2 });
  });

  it('menghitung konten terbit per penceramah dan mengabaikan yang kosong', async () => {
    const { prisma, service } = createService();
    prisma.speaker.findMany.mockResolvedValue([
      { id: 'sp-1', name: 'Ustadz A', slug: 'ustadz-a', _count: { contents: 4 } },
    ]);
    prisma.content.groupBy.mockResolvedValue([
      { speakerId: null, _count: { _all: 2 } },
      { speakerId: 'sp-1', _count: { _all: 4 } },
    ]);

    const [speaker] = await service.listSpeakers();

    expect(speaker).toMatchObject({ publishedCount: 4, totalCount: 4 });
  });

  it('melaporkan jumlah konten terdampak saat kategori dihapus', async () => {
    const { prisma, service } = createService();
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
    prisma.contentCategory.count.mockResolvedValue(6);

    await expect(service.deleteCategory('cat-1')).resolves.toEqual({
      ok: true,
      affectedContents: 6,
    });
    expect(prisma.contentCategory.count).toHaveBeenCalledWith({ where: { categoryId: 'cat-1' } });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
  });

  it('menolak menghapus kategori yang tidak ada', async () => {
    const { prisma, service } = createService();
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.deleteCategory('hilang')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('melaporkan jumlah konten terdampak saat penceramah dan tag dihapus', async () => {
    const { prisma, service } = createService();
    prisma.speaker.findUnique.mockResolvedValue({ id: 'sp-1' });
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1' });
    prisma.content.count.mockResolvedValue(2);
    prisma.contentTag.count.mockResolvedValue(1);

    await expect(service.deleteSpeaker('sp-1')).resolves.toEqual({
      ok: true,
      affectedContents: 2,
    });
    await expect(service.deleteTag('tag-1')).resolves.toEqual({ ok: true, affectedContents: 1 });
  });
});
