import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { can, type BroadcastWatchingList, type WatchStatus } from '@webdakwah/shared';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Pengguna yang mengikuti satu channel siaran langsung.
 *
 * Berbeda dengan tabel `notifications` (satu baris per penerima per
 * peristiwa), baris di sini hanya menandai minat seseorang pada channel:
 * cukup satu baris unik per (profil, channel). Jumlah baris dipakai sebagai
 * penghitung pengikut publik, sedangkan daftar lengkapnya hanya untuk admin.
 */
@Injectable()
export class BroadcastWatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempoten: menekan ikuti dua kali tidak menambah baris baru. */
  async watch(profile: AuthProfile, channelId: string): Promise<WatchStatus> {
    const channel = await this.prisma.liveStream.findUnique({
      where: { id: channelId },
      select: { id: true, isEnabled: true },
    });

    if (!channel) throw new NotFoundException('Channel siaran tidak ditemukan.');
    if (!channel.isEnabled) throw new NotFoundException('Siaran sedang tidak aktif.');

    await this.prisma.broadcastWatching.upsert({
      where: { profileId_channelId: { profileId: profile.id, channelId } },
      create: { profileId: profile.id, channelId },
      update: {},
    });

    return { watching: true, watcherCount: await this.watchingCount(channelId) };
  }

  /** Idempoten: berhenti mengikuti channel yang belum diikuti tidak error. */
  async unwatch(profile: AuthProfile, channelId: string): Promise<WatchStatus> {
    await this.prisma.broadcastWatching.deleteMany({
      where: { profileId: profile.id, channelId },
    });

    return { watching: false, watcherCount: await this.watchingCount(channelId) };
  }

  async status(profile: AuthProfile, channelId: string): Promise<WatchStatus> {
    const [row, watcherCount] = await Promise.all([
      this.prisma.broadcastWatching.findUnique({
        where: { profileId_channelId: { profileId: profile.id, channelId } },
        select: { id: true },
      }),
      this.watchingCount(channelId),
    ]);

    return { watching: Boolean(row), watcherCount };
  }

  async watchingCount(channelId: string): Promise<number> {
    return this.prisma.broadcastWatching.count({ where: { channelId } });
  }

  /** Hanya admin siaran yang boleh melihat daftar lengkap pengikut. */
  async listWatchers(
    profile: AuthProfile,
    channelId: string,
    page: number,
    pageSize: number,
  ): Promise<BroadcastWatchingList> {
    if (!can(profile.role, 'broadcast:manage')) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk melihat pengikut siaran.');
    }

    const where = { channelId };
    const [rows, total] = await Promise.all([
      this.prisma.broadcastWatching.findMany({
        where,
        select: {
          id: true,
          profileId: true,
          createdAt: true,
          profile: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.broadcastWatching.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        profileId: row.profileId,
        fullName: row.profile.fullName,
        email: row.profile.email,
        createdAt: row.createdAt.toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
