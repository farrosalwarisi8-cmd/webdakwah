import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const AUTHOR_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const CONTENT_ID = '33333333-3333-4333-8333-333333333333';

const contributor: AuthProfile = {
  id: AUTHOR_ID,
  email: 'kontributor@example.com',
  fullName: 'Kontributor',
  role: 'CONTRIBUTOR',
  isActive: true,
};

const otherContributor: AuthProfile = {
  ...contributor,
  id: OTHER_ID,
  email: 'lain@example.com',
};

const admin: AuthProfile = {
  id: '44444444-4444-4444-8444-444444444444',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'ADMIN',
  isActive: true,
};

const author = { id: AUTHOR_ID, email: contributor.email, fullName: 'Kontributor' };

function contentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: CONTENT_ID,
    authorId: AUTHOR_ID,
    type: 'ARTICLE',
    status: 'DRAFT',
    title: 'Adab Menuntut Ilmu',
    slug: 'adab-menuntut-ilmu-abc123',
    excerpt: null,
    body: 'Isi artikel yang cukup panjang.',
    mediaUrl: null,
    reviewNote: null,
    publishedAt: null,
    createdAt: new Date('2026-11-15T00:00:00.000Z'),
    updatedAt: new Date('2026-11-15T00:00:00.000Z'),
    author,
    categories: [{ categoryId: '99999999-9999-4999-8999-999999999999' }],
    tags: [],
    speaker: null,
    ...overrides,
  };
}

function createService() {
  const prisma = {
    content: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue({ id: CONTENT_ID }),
    },
  };

  return {
    prisma,
    service: new ContentsService(prisma as unknown as PrismaService),
  };
}

const articleInput = {
  type: 'ARTICLE' as const,
  title: 'Adab Menuntut Ilmu',
  excerpt: 'Ringkasan singkat.',
  body: 'Isi artikel yang cukup panjang.',
  mediaUrl: '',
  categoryIds: [],
  tagNames: [],
  speakerId: null,
};

describe('ContentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('membuat konten baru selalu sebagai draft milik pemanggil', async () => {
    const { prisma, service } = createService();
    prisma.content.create.mockResolvedValue(contentRow());

    await service.create(contributor, articleInput);

    const data = prisma.content.create.mock.calls[0]?.[0].data;

    expect(data).toMatchObject({
      authorId: AUTHOR_ID,
      status: 'DRAFT',
      title: 'Adab Menuntut Ilmu',
      body: 'Isi artikel yang cukup panjang.',
      mediaUrl: null,
    });
    expect(data.slug).toMatch(/^adab-menuntut-ilmu-[0-9a-f]{6}$/);
  });

  it('menyanitasi body dan gambar saat membuat serta menyunting konten', async () => {
    const { prisma, service } = createService();
    prisma.content.create.mockResolvedValue(contentRow());

    await service.create(contributor, {
      ...articleInput,
      body: '<p>Aman</p><img src="https://contoh.com/gambar.png" alt="Gambar" onerror="alert(1)">',
    });

    const createdBody = prisma.content.create.mock.calls[0]?.[0].data.body;

    expect(createdBody).toContain('<p>Aman</p>');
    expect(createdBody).toContain('<img src="https://contoh.com/gambar.png" alt="Gambar"');
    expect(createdBody).not.toContain('onerror');

    prisma.content.findUnique.mockResolvedValue(contentRow());
    prisma.content.update.mockResolvedValue(contentRow());

    await service.update(contributor, CONTENT_ID, {
      ...articleInput,
      body: '<p>Baru</p><img src="x" onerror="alert(1)">',
    });

    expect(prisma.content.update.mock.calls[0]?.[0].data.body).toBe('<p>Baru</p>');
  });

  it('menolak kontributor menyunting konten milik orang lain tanpa membocorkan keberadaannya', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow());

    await expect(service.update(otherContributor, CONTENT_ID, articleInput)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('menolak menyunting konten yang sedang ditinjau', async () => {
    const { prisma, service } = createService();

    prisma.content.findUnique.mockResolvedValue(contentRow({ status: 'PENDING_REVIEW' }));

    await expect(service.update(contributor, CONTENT_ID, articleInput)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('mengizinkan admin menyunting draft kontributor', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow());
    prisma.content.update.mockResolvedValue(contentRow({ title: 'Judul Baru dari Admin' }));

    await service.update(admin, CONTENT_ID, {
      ...articleInput,
      title: 'Judul Baru dari Admin',
    });

    expect(prisma.content.update).toHaveBeenCalledTimes(1);
  });

  it('menolak mengajukan artikel tanpa isi', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow({ body: null }));

    await expect(service.submit(contributor, CONTENT_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.content.update).not.toHaveBeenCalled();
  });

  it('menolak mengajukan audio tanpa tautan media', async () => {
    const { prisma, service } = createService();

    prisma.content.findUnique.mockResolvedValue(
      contentRow({ type: 'AUDIO', body: null, mediaUrl: null }),
    );

    await expect(service.submit(contributor, CONTENT_ID)).rejects.toMatchObject({
      response: {
        statusCode: 400,
        message: expect.arrayContaining([expect.stringContaining('Tautan media wajib diisi')]),
      },
    });
  });

  it('mengajukan draft yang lengkap dan membersihkan catatan review lama', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow({ reviewNote: 'Perbaiki judul' }));
    prisma.content.update.mockResolvedValue(contentRow({ status: 'PENDING_REVIEW' }));

    await service.submit(contributor, CONTENT_ID);

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONTENT_ID },
        data: { status: 'PENDING_REVIEW', reviewNote: null },
      }),
    );
  });

  it('menolak mengajukan konten yang sudah terbit', async () => {
    const { prisma, service } = createService();

    prisma.content.findUnique.mockResolvedValue(contentRow({ status: 'PUBLISHED' }));

    await expect(service.submit(contributor, CONTENT_ID)).rejects.toThrow(
      'Hanya draft atau konten yang ditolak',
    );
  });

  it('menarik kembali konten yang sedang ditinjau menjadi draft', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow({ status: 'PENDING_REVIEW' }));
    prisma.content.update.mockResolvedValue(contentRow({ status: 'DRAFT' }));

    await service.withdraw(contributor, CONTENT_ID);

    expect(prisma.content.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'DRAFT' } }),
    );
  });

  it('menolak menarik kembali konten yang masih draft', async () => {
    const { prisma, service } = createService();

    prisma.content.findUnique.mockResolvedValue(contentRow({ status: 'DRAFT' }));

    await expect(service.withdraw(contributor, CONTENT_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('membatasi daftar milik sendiri dan menghitung total halaman', async () => {
    const { prisma, service } = createService();
    prisma.content.findMany.mockResolvedValue([contentRow()]);
    prisma.content.count.mockResolvedValue(13);

    const result = await service.listMine(contributor, {
      page: 2,
      pageSize: 12,
      status: 'DRAFT',
    });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: AUTHOR_ID, status: 'DRAFT' },
        skip: 12,
        take: 12,
      }),
    );
    expect(result).toMatchObject({ page: 2, total: 13, totalPages: 2 });
  });

  it('menolak admin menghapus konten yang sudah terbit', async () => {
    const { prisma, service } = createService();
    prisma.content.findUnique.mockResolvedValue(contentRow({ status: 'PUBLISHED' }));

    await expect(service.remove(admin, CONTENT_ID)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.content.delete).not.toHaveBeenCalled();
  });

  it('penulis lain tidak bisa membaca konten lewat endpoint detail', async () => {
    const { prisma, service } = createService();
    prisma.content.findFirst.mockResolvedValue(null);

    await expect(service.getById(otherContributor, CONTENT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONTENT_ID, authorId: OTHER_ID },
      }),
    );
  });
});
