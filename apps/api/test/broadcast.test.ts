import { ForbiddenException } from '@nestjs/common';
import {
  broadcastScheduleInputSchema,
  can,
  liveStreamInputSchema,
  permissionsFor,
} from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { BroadcastController } from '../src/modules/broadcast/broadcast.controller.js';
import { BroadcastService } from '../src/modules/broadcast/broadcast.service.js';
import {
  checkLiveStatus,
  isPrivateHostname,
  isPrivateIp,
} from '../src/modules/broadcast/broadcast-status.service.js';
import {
  nextDatedOccurrence,
  nextWeeklyOccurrence,
  toWib,
} from '../src/modules/broadcast/broadcast-time.js';
import type { BroadcastStatusService } from '../src/modules/broadcast/broadcast-status.service.js';
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

const SETTINGS_ROW = {
  id: '99999999-9999-4999-8999-999999999999',
  title: 'Siaran Kajian',
  description: 'Kajian langsung dari radio mitra.',
  streamUrl: 'https://radio.example.com/live',
  playMode: 'EMBED' as const,
  statusUrl: 'https://radio.example.com/status.json',
  telegramUrl: 'https://t.me/kanalradio',
  isEnabled: true,
  updatedAt: new Date('2026-11-17T02:00:00Z'),
};

function createService() {
  const prisma = {
    liveStream: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue({ id: SETTINGS_ROW.id }),
    },
    broadcastSchedule: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    speaker: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };
  const status = {
    getStatus: vi.fn().mockResolvedValue('UNKNOWN' as const),
  };

  return {
    prisma,
    status,
    service: new BroadcastService(
      prisma as unknown as PrismaService,
      status as unknown as BroadcastStatusService,
    ),
  };
}

describe('izin broadcast:manage', () => {
  it('hanya admin yang boleh mengelola siaran', () => {
    expect(can('ADMIN', 'broadcast:manage')).toBe(true);
    expect(can('CONTRIBUTOR', 'broadcast:manage')).toBe(false);
    expect(permissionsFor('CONTRIBUTOR')).not.toContain('broadcast:manage');
    expect(permissionsFor('ADMIN')).toContain('broadcast:manage');
  });

  it('mengizinkan admin membaca pengaturan siaran', async () => {
    const { service } = createService();
    const controller = new BroadcastController(service);

    await expect(controller.getSettings(admin)).resolves.toMatchObject({ isEnabled: false });
  });

  it('menyertakan id channel pada pengaturan admin', async () => {
    const { prisma, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(SETTINGS_ROW);
    const controller = new BroadcastController(service);

    await expect(controller.getSettings(admin)).resolves.toMatchObject({ id: SETTINGS_ROW.id });
  });

  it('menolak kontributor pada endpoint admin siaran (403)', () => {
    const { service } = createService();
    const controller = new BroadcastController(service);

    expect(() => controller.getSettings(contributor)).toThrow(ForbiddenException);
    expect(() => controller.listSchedules(contributor)).toThrow(ForbiddenException);
    expect(() =>
      controller.updateSettings(contributor, {
        title: 'Siaran',
        streamUrl: 'https://radio.example.com/live',
        isEnabled: true,
      }),
    ).toThrow(ForbiddenException);
    expect(() => controller.deleteSettings(contributor)).toThrow(ForbiddenException);
  });
});

describe('BroadcastService.deleteSettings', () => {
  it('menghapus channel siaran dan menyisakan jadwal bila tidak diminta', async () => {
    const { prisma, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(SETTINGS_ROW);
    const controller = new BroadcastController(service);

    await expect(controller.deleteSettings(admin)).resolves.toEqual({
      deleted: true,
      schedulesDeleted: 0,
    });
    expect(prisma.liveStream.delete).toHaveBeenCalledWith({ where: { id: SETTINGS_ROW.id } });
    expect(prisma.broadcastSchedule.deleteMany).not.toHaveBeenCalled();
  });

  it('menghapus channel dan semua jadwal dalam satu transaksi bila diminta', async () => {
    const { prisma, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(SETTINGS_ROW);
    prisma.broadcastSchedule.deleteMany.mockResolvedValue({ count: 3 });
    const controller = new BroadcastController(service);

    await expect(controller.deleteSettings(admin, 'true')).resolves.toEqual({
      deleted: true,
      schedulesDeleted: 3,
    });
    expect(prisma.broadcastSchedule.deleteMany).toHaveBeenCalledWith({});
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.liveStream.delete).toHaveBeenCalledWith({ where: { id: SETTINGS_ROW.id } });
  });

  it('mengabaikan nilai selain true pada opsi hapus jadwal', async () => {
    const { prisma, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(SETTINGS_ROW);
    const controller = new BroadcastController(service);

    await expect(controller.deleteSettings(admin, '1')).resolves.toMatchObject({
      schedulesDeleted: 0,
    });
    expect(prisma.broadcastSchedule.deleteMany).not.toHaveBeenCalled();
  });

  it('menolak menghapus bila belum ada channel tersimpan', async () => {
    const { prisma, service } = createService();

    await expect(service.deleteSettings({ deleteSchedules: true })).rejects.toThrow(
      'Channel siaran belum tersimpan.',
    );
    expect(prisma.liveStream.delete).not.toHaveBeenCalled();
    expect(prisma.broadcastSchedule.deleteMany).not.toHaveBeenCalled();
  });
});

describe('validasi pengaturan siaran', () => {
  const base = {
    title: 'Siaran Kajian',
    streamUrl: 'https://radio.example.com/live',
    playMode: 'EMBED' as const,
    isEnabled: true,
  };

  it('mengizinkan EMBED untuk alamat https', () => {
    expect(liveStreamInputSchema.parse(base).playMode).toBe('EMBED');
  });

  it('memaksa EXTERNAL untuk alamat http agar tidak mixed content', () => {
    const parsed = liveStreamInputSchema.parse({
      ...base,
      streamUrl: 'http://radio.example.com/live',
    });

    expect(parsed.playMode).toBe('EXTERNAL');
  });

  it('menolak skema berbahaya dan URL berkredensial tertanam', () => {
    expect(() =>
      liveStreamInputSchema.parse({ ...base, streamUrl: 'javascript:alert(1)' }),
    ).toThrow();
    expect(() =>
      liveStreamInputSchema.parse({ ...base, streamUrl: 'data:audio/mpeg;base64,AAAA' }),
    ).toThrow();
    expect(() =>
      liveStreamInputSchema.parse({
        ...base,
        streamUrl: 'https://penyiar:rahasia@radio.example.com/live',
      }),
    ).toThrow();
  });

  it('mengizinkan alamat kosong selama siaran belum aktif', () => {
    const parsed = liveStreamInputSchema.parse({ ...base, streamUrl: '', isEnabled: false });

    expect(parsed.streamUrl).toBe('');
  });

  it('menolak mengaktifkan siaran tanpa alamat dengar', () => {
    expect(() =>
      liveStreamInputSchema.parse({ ...base, streamUrl: '', isEnabled: true }),
    ).toThrow();
  });

  it('statusUrl menerima http, telegramUrl tetap wajib https', () => {
    expect(
      liveStreamInputSchema.parse({ ...base, telegramUrl: 'https://t.me/kanalradio' }).telegramUrl,
    ).toBe('https://t.me/kanalradio');
    expect(() =>
      liveStreamInputSchema.parse({ ...base, telegramUrl: 'http://t.me/kanalradio' }),
    ).toThrow();
    expect(
      liveStreamInputSchema.parse({ ...base, statusUrl: 'http://radio.example.com/status' })
        .statusUrl,
    ).toBe('http://radio.example.com/status');
    expect(() =>
      liveStreamInputSchema.parse({ ...base, statusUrl: 'ftp://radio.example.com/status' }),
    ).toThrow();
    expect(() =>
      liveStreamInputSchema.parse({ ...base, statusUrl: 'https://user:pass@radio.example.com' }),
    ).toThrow();
  });
});

describe('validasi jadwal siaran', () => {
  const base = {
    title: 'Tafsir Al-Qur’an',
    startTime: '19:30',
    durationMin: 90,
  };

  it('menolak jadwal tanpa hari maupun tanggal', () => {
    expect(() => broadcastScheduleInputSchema.parse({ ...base })).toThrow();
    expect(() =>
      broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: null, date: null }),
    ).toThrow();
  });

  it('menolak jadwal yang mengisi hari dan tanggal sekaligus', () => {
    expect(() =>
      broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 1, date: '2026-12-01' }),
    ).toThrow();
  });

  it('menerima jadwal mingguan atau tanggal khusus', () => {
    expect(broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 1 }).dayOfWeek).toBe(1);
    expect(broadcastScheduleInputSchema.parse({ ...base, date: '2026-12-01' }).date).toBe(
      '2026-12-01',
    );
  });

  it('menolak hari, jam, tanggal, dan durasi yang tidak valid', () => {
    expect(() => broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 7 })).toThrow();
    expect(() =>
      broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 1, startTime: '25:00' }),
    ).toThrow();
    expect(() =>
      broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 1, date: '01-12-2026' }),
    ).toThrow();
    expect(() =>
      broadcastScheduleInputSchema.parse({ ...base, dayOfWeek: 1, durationMin: 2 }),
    ).toThrow();
  });
});

describe('perhitungan jadwal WIB', () => {
  const now = new Date('2026-11-17T05:00:00Z'); // 12:00 WIB

  it('mengambil jadwal mingguan berikutnya pada hari dan jam yang benar', () => {
    const current = toWib(now);
    const result = nextWeeklyOccurrence(now, current.weekday, '23:59');

    expect(result).not.toBeNull();
    const parts = toWib(result as Date);
    expect(parts.weekday).toBe(current.weekday);
    expect(parts.minutesOfDay).toBe(23 * 60 + 59);
    expect((result as Date).getTime()).toBeGreaterThan(now.getTime());
  });

  it('menggeser ke pekan berikutnya bila jam hari ini sudah lewat', () => {
    const current = toWib(now);
    const result = nextWeeklyOccurrence(now, current.weekday, '08:00');

    expect(result).not.toBeNull();
    expect((result as Date).getTime() - now.getTime()).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
  });

  it('menghitung acara khusus dan menolak tanggal yang sudah lewat', () => {
    const future = nextDatedOccurrence(now, new Date('2026-12-01T00:00:00Z'), '20:00');

    expect(future).not.toBeNull();
    expect(toWib(future as Date).minutesOfDay).toBe(20 * 60);

    expect(nextDatedOccurrence(now, new Date('2026-01-01T00:00:00Z'), '20:00')).toBeNull();
  });
});

describe('BroadcastService.getPublicLive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tidak membocorkan statusUrl, id, atau field internal jadwal', async () => {
    const { prisma, status, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(SETTINGS_ROW);
    prisma.broadcastSchedule.findMany.mockResolvedValue([
      {
        id: '11111111-2222-4333-8444-555555555555',
        title: 'Kajian Rutin',
        speakerId: null,
        speaker: null,
        dayOfWeek: toWib(new Date()).weekday,
        date: null,
        startTime: '23:59',
        durationMin: 60,
        notes: 'Terbuka untuk umum.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getPublicLive();

    expect(status.getStatus).toHaveBeenCalledWith(SETTINGS_ROW.statusUrl);
    expect(Object.keys(result).sort()).toEqual(
      [
        'channelId',
        'description',
        'isEnabled',
        'liveStatus',
        'playMode',
        'schedules',
        'streamUrl',
        'telegramUrl',
        'title',
      ].sort(),
    );
    expect(result.channelId).toBe(SETTINGS_ROW.id);
    expect(JSON.stringify(result)).not.toContain('status.example');
    expect(JSON.stringify(result)).not.toContain(SETTINGS_ROW.statusUrl);
    expect(result.schedules[0]).not.toHaveProperty('id');
    expect(result.schedules[0]).not.toHaveProperty('isActive');
    expect(result.schedules[0]).not.toHaveProperty('speakerId');
  });

  it('hanya mengambil jadwal aktif dan membuang acara khusus yang sudah lewat', async () => {
    const { prisma, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue(null);
    prisma.broadcastSchedule.findMany.mockResolvedValue([]);

    await service.getPublicLive();

    expect(prisma.broadcastSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('tidak memeriksa status saat siaran dinonaktifkan', async () => {
    const { prisma, status, service } = createService();
    prisma.liveStream.findFirst.mockResolvedValue({ ...SETTINGS_ROW, isEnabled: false });

    const result = await service.getPublicLive();

    expect(result.liveStatus).toBe('UNKNOWN');
    expect(status.getStatus).not.toHaveBeenCalled();
  });
});

describe('pemeriksaan status siaran', () => {
  const publicResolver = vi.fn().mockResolvedValue(['93.184.216.34']);

  it('menolak host privat, loopback, dan nama internal sebelum fetch', async () => {
    expect(isPrivateHostname('localhost')).toBe(true);
    expect(isPrivateHostname('127.0.0.1')).toBe(true);
    expect(isPrivateHostname('10.0.0.5')).toBe(true);
    expect(isPrivateHostname('192.168.1.2')).toBe(true);
    expect(isPrivateHostname('169.254.169.254')).toBe(true);
    expect(isPrivateHostname('radio.internal')).toBe(true);
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('fd00::1')).toBe(true);
    expect(isPrivateIp('::ffff:7f00:1')).toBe(true);
    expect(isPrivateHostname('radio.example.com')).toBe(false);

    const fetcher = vi.fn();
    await expect(
      checkLiveStatus('https://127.0.0.1/status', { fetcher, resolver: publicResolver }),
    ).resolves.toBe('UNKNOWN');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('menerima statusUrl http dan menolak host yang DNS-nya privat', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('live', { status: 200 }));
    await expect(
      checkLiveStatus('http://radio.example.com/status', { fetcher, resolver: publicResolver }),
    ).resolves.toBe('LIVE');
    expect(fetcher).toHaveBeenCalledOnce();

    fetcher.mockClear();

    await expect(
      checkLiveStatus('https://radio.example.com/status', {
        fetcher,
        resolver: vi.fn().mockResolvedValue(['10.0.0.5']),
      }),
    ).resolves.toBe('UNKNOWN');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('menangani timeout dan error jaringan tanpa melempar error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'));

    await expect(
      checkLiveStatus('https://radio.example.com/status', { fetcher, resolver: publicResolver }),
    ).resolves.toBe('UNKNOWN');
  });

  it('membaca status JSON/teks dan menolak redirect atau respons kebesaran', async () => {
    const live = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ live: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(
      checkLiveStatus('https://radio.example.com/status', {
        fetcher: live,
        resolver: publicResolver,
      }),
    ).resolves.toBe('LIVE');

    const offline = vi.fn().mockResolvedValue(new Response('offline', { status: 200 }));
    await expect(
      checkLiveStatus('https://radio.example.com/status', {
        fetcher: offline,
        resolver: publicResolver,
      }),
    ).resolves.toBe('OFFLINE');

    const redirect = vi.fn().mockResolvedValue(new Response(null, { status: 302 }));
    await expect(
      checkLiveStatus('https://radio.example.com/status', {
        fetcher: redirect,
        resolver: publicResolver,
      }),
    ).resolves.toBe('UNKNOWN');

    const oversized = vi
      .fn()
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-length': '40000' } }),
      );
    await expect(
      checkLiveStatus('https://radio.example.com/status', {
        fetcher: oversized,
        resolver: publicResolver,
      }),
    ).resolves.toBe('UNKNOWN');
  });
});
