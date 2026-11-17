import { BROADCAST_TIMEZONE } from '@webdakwah/shared';

/**
 * WIB (Asia/Jakarta) selalu UTC+7 tanpa DST. Semua perhitungan jadwal memakai
 * pergeseran tetap ini agar hasilnya sama di server mana pun.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface WibNow {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutesOfDay: number;
}

/** Komponen waktu WIB dari sebuah instan. */
export function toWib(date: Date): WibNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BROADCAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: WEEKDAY_INDEX[value('weekday')] ?? 0,
    minutesOfDay: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

/** Instan UTC yang mewakili tanggal + jam dinding WIB tertentu. */
export function wibDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  minutesOfDay: number,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) + minutesOfDay * 60_000 - WIB_OFFSET_MS,
  );
}

export function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Waktu mulai berikutnya untuk jadwal mingguan, dihitung dari sekarang.
 * Jadwal yang jamnya baru lewat hari ini akan muncul pekan depan.
 */
export function nextWeeklyOccurrence(now: Date, dayOfWeek: number, startTime: string): Date | null {
  const minutes = parseTimeToMinutes(startTime);

  if (minutes === null) return null;

  const current = toWib(now);
  const deltaDays = (dayOfWeek - current.weekday + 7) % 7;
  const candidateMinutes = deltaDays * 1440 + minutes;
  const isPast = deltaDays === 0 && minutes <= current.minutesOfDay;

  const dayOffset = isPast ? candidateMinutes + 7 * 1440 : candidateMinutes;

  return wibDateTimeToUtc(current.year, current.month, current.day, dayOffset);
}

/** Waktu mulai acara khusus; null bila tanggal/jam sudah lewat. */
export function nextDatedOccurrence(now: Date, date: Date, startTime: string): Date | null {
  const minutes = parseTimeToMinutes(startTime);

  if (minutes === null) return null;

  const candidate = wibDateTimeToUtc(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    minutes,
  );

  return candidate.getTime() > now.getTime() ? candidate : null;
}
