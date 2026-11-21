import { BROADCAST_TIMEZONE_LABEL, DAY_OF_WEEK_LABELS } from '@webdakwah/shared';

/**
 * Jadwal yang bisa dipakai penghitung; bentuknya sengaja longgar agar halaman
 * publik maupun data admin bisa diuji tanpa API.
 */
export interface BroadcastScheduleLike {
  title: string;
  dayOfWeek: number | null;
  date: string | null;
  startTime: string;
  durationMin: number;
  isActive?: boolean;
}

export type ScheduleHint =
  | { kind: 'IN_WINDOW'; title: string; label: string; startsAt: Date }
  | { kind: 'NEXT'; title: string; label: string; startsAt: Date }
  | { kind: 'NONE' };

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

interface WibDate {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutesOfDay: number;
}

/** Komponen tanggal/jam WIB dari sebuah instan (UTC+7 tetap, tanpa DST). */
export function toWibDate(value: Date): WibDate {
  const shifted = new Date(value.getTime() + WIB_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function wibInstant(year: number, month: number, day: number, minutes: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + minutes * 60_000 - WIB_OFFSET_MS);
}

function parseTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());

  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function dayLabel(weekday: number): string {
  return DAY_OF_WEEK_LABELS[weekday] ?? '';
}

function clockLabel(minutes: number): string {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');

  return `${hour}.${minute}`;
}

function formatStart(start: Date): string {
  const wib = toWibDate(start);

  return `${dayLabel(wib.weekday)} ${clockLabel(wib.minutesOfDay)} ${BROADCAST_TIMEZONE_LABEL}`;
}

interface Occurrence {
  schedule: BroadcastScheduleLike;
  startsAt: Date;
}

/**
 * Menghitung kemungkinan tayang dari jadwal aktif, semuanya dalam WIB:
 * - jadwal yang sedang berlangsung (`IN_WINDOW`),
 * - jadwal berikutnya (`NEXT`),
 * - atau tidak ada jadwal (`NONE`).
 * Dipakai saat status radio tidak diketahui agar halaman tetap informatif.
 */
export function describeBroadcastSchedule(
  now: Date,
  schedules: readonly BroadcastScheduleLike[],
): ScheduleHint {
  const current = toWibDate(now);
  const nowMs = now.getTime();
  const occurrences: Occurrence[] = [];

  for (const schedule of schedules) {
    if (schedule.isActive === false) continue;

    const minutes = parseTime(schedule.startTime);

    if (minutes === null) continue;

    if (schedule.dayOfWeek !== null && schedule.dayOfWeek !== undefined) {
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) continue;

      const deltaDays = (schedule.dayOfWeek - current.weekday + 7) % 7;
      const todayStart = wibInstant(
        current.year,
        current.month,
        current.day,
        deltaDays * 1440 + minutes,
      );

      const durationMs = Math.max(0, schedule.durationMin) * 60_000;

      // Jadwal hari ini yang masih berjalan.
      if (todayStart.getTime() <= nowMs && nowMs < todayStart.getTime() + durationMs) {
        occurrences.push({ schedule, startsAt: todayStart });
        continue;
      }

      const nextStart =
        todayStart.getTime() > nowMs ? todayStart : new Date(todayStart.getTime() + 7 * 86_400_000);

      occurrences.push({ schedule, startsAt: nextStart });
      continue;
    }

    if (schedule.date) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(schedule.date);

      if (!match) continue;

      const start = wibInstant(Number(match[1]), Number(match[2]), Number(match[3]), minutes);
      const durationMs = Math.max(0, schedule.durationMin) * 60_000;

      if (start.getTime() <= nowMs && nowMs < start.getTime() + durationMs) {
        occurrences.push({ schedule, startsAt: start });
      } else if (start.getTime() > nowMs) {
        occurrences.push({ schedule, startsAt: start });
      }
    }
  }

  if (occurrences.length === 0) return { kind: 'NONE' };

  const running = occurrences
    .filter((entry) => entry.startsAt.getTime() <= nowMs)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];

  if (running) {
    return {
      kind: 'IN_WINDOW',
      title: running.schedule.title,
      startsAt: running.startsAt,
      label: `Seharusnya sedang berlangsung: ${running.schedule.title} · ${formatStart(running.startsAt)}`,
    };
  }

  const upcoming = occurrences
    .filter((entry) => entry.startsAt.getTime() > nowMs)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

  if (!upcoming) return { kind: 'NONE' };

  return {
    kind: 'NEXT',
    title: upcoming.schedule.title,
    startsAt: upcoming.startsAt,
    label: `Berikutnya: ${upcoming.schedule.title}, ${formatStart(upcoming.startsAt)}`,
  };
}
