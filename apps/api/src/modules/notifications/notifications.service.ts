import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PaginationQuery } from '@webdakwah/shared';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface NotifiedContent {
  id: string;
  title: string;
  reviewNote?: string | null;
  author: { id: string; fullName: string | null; email: string };
}

function displayName(profile: { fullName: string | null; email: string }): string {
  return profile.fullName ?? profile.email;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Notifikasi dalam aplikasi. Semua baris hanya bisa dibaca dan ditandai oleh
 * pemiliknya; pembuatan baris dilakukan server saat transisi konten.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(profile: AuthProfile, query: PaginationQuery) {
    const where = { userId: profile.id };

    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          href: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      unread,
    };
  }

  async unreadCount(profile: AuthProfile) {
    const unread = await this.prisma.notification.count({
      where: { userId: profile.id, isRead: false },
    });

    return { unread };
  }

  async markRead(profile: AuthProfile, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId: profile.id },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notifikasi tidak ditemukan.');
    }

    return { ok: true };
  }

  async markAllRead(profile: AuthProfile) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: profile.id, isRead: false },
      data: { isRead: true },
    });

    return { ok: true, updated: result.count };
  }

  /** Beri tahu semua admin aktif lain saat konten diajukan untuk review. */
  async notifySubmitted(actor: AuthProfile, content: { id: string; title: string }) {
    try {
      const admins = await this.prisma.profile.findMany({
        where: { role: 'ADMIN', isActive: true, id: { not: actor.id } },
        select: { id: true },
      });

      if (admins.length === 0) return;

      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'CONTENT_SUBMITTED' as const,
          title: 'Konten baru menunggu review',
          message: truncate(
            `"${content.title}" dari ${displayName(actor)} menunggu ditinjau.`,
            500,
          ),
          href: `/dashboard/moderasi/${content.id}`,
          contentId: content.id,
        })),
      });
    } catch (error) {
      this.logger.warn(`Gagal membuat notifikasi review: ${(error as Error).message}`);
    }
  }

  /** Beri tahu penulis saat kontennya terbit; lewati bila ia sendiri adminnya. */
  async notifyPublished(actor: AuthProfile, content: NotifiedContent) {
    if (content.author.id === actor.id) return;

    await this.createForAuthor(content, {
      type: 'CONTENT_PUBLISHED',
      title: 'Konten Anda sudah terbit',
      message: truncate(`"${content.title}" sudah tayang di website.`, 500),
    });
  }

  /** Beri tahu penulis saat kontennya ditolak, beserta catatan admin. */
  async notifyRejected(actor: AuthProfile, content: NotifiedContent) {
    if (content.author.id === actor.id) return;

    const note = content.reviewNote?.trim();

    await this.createForAuthor(content, {
      type: 'CONTENT_REJECTED',
      title: 'Konten Anda perlu diperbaiki',
      message: truncate(
        note
          ? `"${content.title}" perlu diperbaiki: ${note}`
          : `"${content.title}" perlu diperbaiki.`,
        500,
      ),
    });
  }

  private async createForAuthor(
    content: NotifiedContent,
    notification: {
      type: 'CONTENT_PUBLISHED' | 'CONTENT_REJECTED';
      title: string;
      message: string;
    },
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId: content.author.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          href: `/dashboard/konten/${content.id}`,
          contentId: content.id,
        },
      });
    } catch (error) {
      this.logger.warn(`Gagal membuat notifikasi konten: ${(error as Error).message}`);
    }
  }
}
