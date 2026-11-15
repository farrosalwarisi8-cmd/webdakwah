import { ForbiddenException } from '@nestjs/common';
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

  it('membersihkan tag yatim secara best-effort', async () => {
    const { prisma, service } = createService();
    prisma.tag.deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.cleanupOrphanTags()).resolves.toBeUndefined();
    expect(prisma.tag.deleteMany).toHaveBeenCalledWith({
      where: { contents: { none: {} } },
    });
  });
});
