import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  can,
  PUBLIC_SCHEDULE_LIMIT,
  type AdminBroadcastSchedule,
  type AdminLiveStream,
  type BroadcastScheduleInput,
  type LiveStreamInput,
  type PublicBroadcastSchedule,
  type PublicLive,
} from '@webdakwah/shared';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BroadcastStatusService } from './broadcast-status.service.js';
import { nextDatedOccurrence, nextWeeklyOccurrence } from './broadcast-time.js';

const DEFAULT_TITLE = 'Siaran Langsung';

const DEFAULT_SETTINGS: AdminLiveStream = {
  id: null,
  title: DEFAULT_TITLE,
  description: null,
  streamUrl: null,
  playMode: 'EXTERNAL',
  statusUrl: null,
  telegramUrl: null,
  isEnabled: false,
  updatedAt: null,
};

type ScheduleRow = {
  id: string;
  title: string;
  speakerId: string | null;
  dayOfWeek: number | null;
  date: Date | null;
  startTime: string;
  durationMin: number;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  speaker: { name: string } | null;
};

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapAdminSchedule(row: ScheduleRow): AdminBroadcastSchedule {
  return {
    id: row.id,
    title: row.title,
    speakerId: row.speakerId,
    speakerName: row.speaker?.name ?? null,
    dayOfWeek: row.dayOfWeek,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    startTime: row.startTime,
    durationMin: row.durationMin,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class BroadcastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly status: BroadcastStatusService,
  ) {}

  assertManager(profile: AuthProfile): void {
    if (!can(profile.role, 'broadcast:manage')) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengelola siaran.');
    }
  }

  async getSettings(): Promise<AdminLiveStream> {
    const row = await this.prisma.liveStream.findFirst({ orderBy: { updatedAt: 'desc' } });

    if (!row) return DEFAULT_SETTINGS;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      streamUrl: row.streamUrl,
      playMode: row.playMode,
      statusUrl: row.statusUrl,
      telegramUrl: row.telegramUrl,
      isEnabled: row.isEnabled,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateSettings(input: LiveStreamInput): Promise<AdminLiveStream> {
    const data = {
      title: input.title,
      description: input.description || null,
      streamUrl: input.streamUrl || null,
      playMode: input.playMode,
      statusUrl: input.statusUrl || null,
      telegramUrl: input.telegramUrl || null,
      isEnabled: input.isEnabled,
    };

    const existing = await this.prisma.liveStream.findFirst({ orderBy: { updatedAt: 'desc' } });

    const row = existing
      ? await this.prisma.liveStream.update({ where: { id: existing.id }, data })
      : await this.prisma.liveStream.create({ data });

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      streamUrl: row.streamUrl,
      playMode: row.playMode,
      statusUrl: row.statusUrl,
      telegramUrl: row.telegramUrl,
      isEnabled: row.isEnabled,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Menghapus channel siaran; pengikut ikut terhapus lewat relasi, jadwal tetap disimpan. */
  async deleteSettings(): Promise<{ deleted: true }> {
    const existing = await this.prisma.liveStream.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Channel siaran belum tersimpan.');
    }

    await this.prisma.liveStream.delete({ where: { id: existing.id } });

    return { deleted: true };
  }

  async listSchedules(): Promise<AdminBroadcastSchedule[]> {
    const rows = await this.prisma.broadcastSchedule.findMany({
      orderBy: [{ isActive: 'desc' }, { dayOfWeek: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
      include: { speaker: { select: { name: true } } },
    });

    return rows.map(mapAdminSchedule);
  }

  private async assertSpeakerExists(speakerId: string | null | undefined): Promise<void> {
    if (!speakerId) return;

    const speaker = await this.prisma.speaker.findUnique({
      where: { id: speakerId },
      select: { id: true },
    });

    if (!speaker) {
      throw new BadRequestException('Penceramah tidak ditemukan.');
    }
  }

  private scheduleData(input: BroadcastScheduleInput) {
    return {
      title: input.title,
      speakerId: input.speakerId ?? null,
      dayOfWeek: input.date ? null : (input.dayOfWeek ?? null),
      date: input.date ? toDateOnly(input.date) : null,
      startTime: input.startTime,
      durationMin: input.durationMin,
      notes: input.notes || null,
      isActive: input.isActive,
    };
  }

  async createSchedule(input: BroadcastScheduleInput): Promise<AdminBroadcastSchedule> {
    await this.assertSpeakerExists(input.speakerId);

    const row = await this.prisma.broadcastSchedule.create({
      data: this.scheduleData(input),
      include: { speaker: { select: { name: true } } },
    });

    return mapAdminSchedule(row);
  }

  async updateSchedule(id: string, input: BroadcastScheduleInput): Promise<AdminBroadcastSchedule> {
    const existing = await this.prisma.broadcastSchedule.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Jadwal siaran tidak ditemukan.');
    }

    await this.assertSpeakerExists(input.speakerId);

    const row = await this.prisma.broadcastSchedule.update({
      where: { id },
      data: this.scheduleData(input),
      include: { speaker: { select: { name: true } } },
    });

    return mapAdminSchedule(row);
  }

  async deleteSchedule(id: string): Promise<{ deleted: true }> {
    const existing = await this.prisma.broadcastSchedule.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Jadwal siaran tidak ditemukan.');
    }

    await this.prisma.broadcastSchedule.delete({ where: { id } });

    return { deleted: true };
  }

  /** Payload publik: tanpa id, statusUrl, atau data internal lainnya. */
  async getPublicLive(): Promise<PublicLive> {
    const [settings, rows] = await Promise.all([
      this.prisma.liveStream.findFirst({ orderBy: { updatedAt: 'desc' } }),
      this.prisma.broadcastSchedule.findMany({
        where: { isActive: true },
        include: { speaker: { select: { name: true } } },
        orderBy: [{ startTime: 'asc' }],
      }),
    ]);

    const now = new Date();
    const upcoming: (PublicBroadcastSchedule & { sortKey: number })[] = [];

    for (const row of rows) {
      const nextAt = row.date
        ? nextDatedOccurrence(now, row.date, row.startTime)
        : row.dayOfWeek === null
          ? null
          : nextWeeklyOccurrence(now, row.dayOfWeek, row.startTime);

      if (!nextAt) continue;

      upcoming.push({
        title: row.title,
        speakerName: row.speaker?.name ?? null,
        dayOfWeek: row.dayOfWeek,
        date: row.date ? row.date.toISOString().slice(0, 10) : null,
        startTime: row.startTime,
        durationMin: row.durationMin,
        notes: row.notes,
        nextAt: nextAt.toISOString(),
        sortKey: nextAt.getTime(),
      });
    }

    upcoming.sort((a, b) => a.sortKey - b.sortKey);

    const isEnabled = settings?.isEnabled ?? false;
    const streamUrl = settings?.streamUrl ?? null;
    const liveStatus =
      isEnabled && settings?.statusUrl
        ? await this.status.getStatus(settings.statusUrl)
        : 'UNKNOWN';

    return {
      isEnabled,
      channelId: settings?.id ?? null,
      title: settings?.title ?? DEFAULT_TITLE,
      description: settings?.description ?? null,
      streamUrl,
      playMode: settings?.playMode ?? null,
      telegramUrl: settings?.telegramUrl ?? null,
      schedules: upcoming
        .slice(0, PUBLIC_SCHEDULE_LIMIT)
        .map(({ sortKey: _sortKey, ...schedule }) => schedule),
      liveStatus,
    };
  }
}
