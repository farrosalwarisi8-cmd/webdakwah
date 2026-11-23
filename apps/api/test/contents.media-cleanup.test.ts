import { ForbiddenException } from '@nestjs/common';
import type { ContentInput } from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';
import type { StorageService } from '../src/modules/storage/storage.service.js';

const CONTENT_ID = '33333333-3333-4333-8333-333333333333';
const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const OLD_URL = `https://media.contoh.test/media/${OWNER_ID}/lama.mp3`;
const NEW_URL = `https://media.contoh.test/media/${OWNER_ID}/baru.mp3`;

const owner: AuthProfile = {
  id: OWNER_ID,
  email: 'kontributor@example.com',
  fullName: 'Kontributor',
  role: 'CONTRIBUTOR',
  isActive: true,
  accountStatus: 'APPROVED',
};

const admin: AuthProfile = {
  ...owner,
  id: '44444444-4444-4444-8444-444444444444',
  role: 'ADMIN',
};

const baseRow = {
  id: CONTENT_ID,
  authorId: OWNER_ID,
  status: 'DRAFT' as const,
  title: 'Kajian Sabar',
  type: 'AUDIO' as const,
  excerpt: 'Ringkasan',
  body: null,
  mediaUrl: OLD_URL,
};

function input(mediaUrl: string): ContentInput {
  return {
    type: 'AUDIO',
    title: baseRow.title,
    excerpt: 'Ringkasan',
    body: '',
    mediaUrl,
    categoryIds: [],
    tagNames: [],
    speakerId: null,
  };
}

function createService(row: typeof baseRow) {
  const prisma = {
    content: {
      findUnique: vi.fn().mockResolvedValue(row),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({ id: CONTENT_ID }),
      delete: vi.fn().mockResolvedValue({ id: CONTENT_ID }),
    },
  };
  const storage = {
    deleteByPublicUrl: vi.fn().mockResolvedValue(true),
  };

  return {
    prisma,
    storage,
    service: new ContentsService(
      prisma as unknown as PrismaService,
      undefined,
      storage as unknown as StorageService,
    ),
  };
}

describe('ContentsService — pembersihan media R2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menghapus objek lama saat media diganti', async () => {
    const { service, storage } = createService(baseRow);

    await service.update(owner, CONTENT_ID, input(NEW_URL));

    expect(storage.deleteByPublicUrl).toHaveBeenCalledWith(OLD_URL, OWNER_ID);
  });

  it('menghapus objek lama saat tautan media dikosongkan', async () => {
    const { service, storage } = createService(baseRow);

    await service.update(owner, CONTENT_ID, input('   '));

    expect(storage.deleteByPublicUrl).toHaveBeenCalledWith(OLD_URL, OWNER_ID);
  });

  it('tidak menghapus saat media tetap sama', async () => {
    const { service, storage } = createService(baseRow);

    await service.update(owner, CONTENT_ID, input(OLD_URL));

    expect(storage.deleteByPublicUrl).not.toHaveBeenCalled();
  });

  it('menghapus objek dengan folder penulis konten, bukan pemanggil', async () => {
    const { service, storage } = createService(baseRow);

    await service.update(admin, CONTENT_ID, input(NEW_URL));

    expect(storage.deleteByPublicUrl).toHaveBeenCalledWith(OLD_URL, OWNER_ID);
  });

  it('menghapus objek saat konten dihapus', async () => {
    const { service, prisma, storage } = createService(baseRow);

    await service.remove(owner, CONTENT_ID);

    expect(prisma.content.delete).toHaveBeenCalledWith({ where: { id: CONTENT_ID } });
    expect(storage.deleteByPublicUrl).toHaveBeenCalledWith(OLD_URL, OWNER_ID);
  });

  it('tidak menghapus objek saat konten terbit tidak boleh dihapus', async () => {
    const { service, storage } = createService({ ...baseRow, status: 'PUBLISHED' });

    await expect(service.remove(admin, CONTENT_ID)).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.deleteByPublicUrl).not.toHaveBeenCalled();
  });
});
