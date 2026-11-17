import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { ContentsService } from '../src/modules/contents/contents.service.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const CONTENT_ID = '33333333-3333-4333-8333-333333333333';
const NOTIFICATION_ID = '55555555-5555-4555-8555-555555555555';

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

const author = { id: contributor.id, fullName: 'Kontributor', email: contributor.email };

function createService() {
  const prisma = {
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({ id: NOTIFICATION_ID }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    profile: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  return {
    prisma,
    service: new NotificationsService(prisma as unknown as PrismaService),
  };
}

describe('NotificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hanya membaca notifikasi milik pengguna dan menghitung yang belum dibaca', async () => {
    const { prisma, service } = createService();
    prisma.notification.findMany.mockResolvedValue([
      {
        id: NOTIFICATION_ID,
        type: 'CONTENT_PUBLISHED',
        title: 'Konten Anda sudah terbit',
        message: '"Kajian" sudah tayang.',
        href: `/dashboard/konten/${CONTENT_ID}`,
        isRead: false,
        createdAt: new Date('2026-11-17T03:00:00Z'),
      },
    ]);
    prisma.notification.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

    const result = await service.list(contributor, { page: 2, pageSize: 2 });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: contributor.id },
        skip: 2,
        take: 2,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(prisma.notification.count).toHaveBeenNthCalledWith(2, {
      where: { userId: contributor.id, isRead: false },
    });
    expect(result).toMatchObject({ total: 4, totalPages: 2, unread: 2 });
  });

  it('menolak menandai notifikasi milik pengguna lain sebagai dibaca', async () => {
    const { prisma, service } = createService();

    await expect(service.markRead(contributor, NOTIFICATION_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTIFICATION_ID, userId: contributor.id },
        data: { isRead: true },
      }),
    );
  });

  it('menandai notifikasi sendiri dan semua notifikasi sekaligus', async () => {
    const { prisma, service } = createService();
    prisma.notification.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 3 });

    await expect(service.markRead(contributor, NOTIFICATION_ID)).resolves.toEqual({ ok: true });
    await expect(service.markAllRead(contributor)).resolves.toEqual({ ok: true, updated: 3 });
    expect(prisma.notification.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { userId: contributor.id, isRead: false },
        data: { isRead: true },
      }),
    );
  });

  it('mengirim notifikasi review ke admin aktif lain, bukan ke pengaju', async () => {
    const { prisma, service } = createService();
    prisma.profile.findMany.mockResolvedValue([{ id: admin.id }]);

    await service.notifySubmitted(contributor, { id: CONTENT_ID, title: 'Kajian Baru' });

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'ADMIN', isActive: true, id: { not: contributor.id } },
      }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: admin.id,
          type: 'CONTENT_SUBMITTED',
          contentId: CONTENT_ID,
          href: `/dashboard/moderasi/${CONTENT_ID}`,
          message: expect.stringContaining('Kajian Baru'),
        }),
      ],
    });
  });

  it('tidak membuat notifikasi bila tidak ada admin lain', async () => {
    const { prisma, service } = createService();

    await service.notifySubmitted(contributor, { id: CONTENT_ID, title: 'Kajian Baru' });

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('memberi tahu penulis saat terbit dan menolak, tetapi tidak untuk diri sendiri', async () => {
    const { prisma, service } = createService();
    const content = { id: CONTENT_ID, title: 'Kajian', author };

    await service.notifyPublished(admin, content);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: author.id,
        type: 'CONTENT_PUBLISHED',
        href: `/dashboard/konten/${CONTENT_ID}`,
      }),
    });

    await service.notifyRejected(admin, {
      ...content,
      reviewNote: 'Tambahkan sumber rujukan.',
    });
    expect(prisma.notification.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        userId: author.id,
        type: 'CONTENT_REJECTED',
        message: expect.stringContaining('Tambahkan sumber rujukan.'),
      }),
    });

    prisma.notification.create.mockClear();
    await service.notifyPublished(admin, { ...content, author: admin });
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe('integrasi notifikasi dengan moderasi konten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createContentsService() {
    const prisma = {
      content: {
        findUnique: vi.fn().mockResolvedValue({ id: CONTENT_ID, status: 'PENDING_REVIEW' }),
        update: vi.fn().mockResolvedValue({
          id: CONTENT_ID,
          title: 'Kajian',
          reviewNote: 'Perbaiki',
          author,
        }),
      },
    };
    const notifications = {
      notifySubmitted: vi.fn().mockResolvedValue(undefined),
      notifyPublished: vi.fn().mockResolvedValue(undefined),
      notifyRejected: vi.fn().mockResolvedValue(undefined),
    };

    return {
      notifications,
      service: new ContentsService(
        prisma as unknown as PrismaService,
        undefined,
        undefined,
        undefined,
        notifications as unknown as NotificationsService,
      ),
    };
  }

  it('memanggil notifikasi saat konten diterbitkan', async () => {
    const { notifications, service } = createContentsService();

    await service.publish(admin, CONTENT_ID);

    expect(notifications.notifyPublished).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ id: CONTENT_ID, title: 'Kajian' }),
    );
  });

  it('memanggil notifikasi saat konten ditolak', async () => {
    const { notifications, service } = createContentsService();

    await service.reject(admin, CONTENT_ID, 'Tambahkan sumber rujukan yang jelas.');

    expect(notifications.notifyRejected).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ id: CONTENT_ID, title: 'Kajian' }),
    );
  });
});
