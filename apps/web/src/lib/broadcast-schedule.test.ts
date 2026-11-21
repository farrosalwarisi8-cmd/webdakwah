import { describe, expect, it } from 'vitest';

import { describeBroadcastSchedule, toWibDate } from './broadcast-schedule';

const schedule = {
  title: 'Kajian Subuh',
  dayOfWeek: 1,
  date: null,
  startTime: '04:30',
  durationMin: 60,
};

// Minggu, 22 November 2026, 16:00 WIB.
const sundayAfternoon = new Date('2026-11-22T09:00:00Z');

function withoutNone(hint: ReturnType<typeof describeBroadcastSchedule>) {
  if (hint.kind === 'NONE') throw new Error('Jadwal tidak boleh kosong pada kasus ini.');

  return hint;
}

describe('penghitung jadwal siaran saat status tidak diketahui', () => {
  it('menampilkan jadwal mingguan berikutnya dalam WIB', () => {
    const hint = withoutNone(describeBroadcastSchedule(sundayAfternoon, [schedule]));

    expect(hint.kind).toBe('NEXT');
    expect(hint.label).toBe('Berikutnya: Kajian Subuh, Senin 04.30 WIB');
    expect(toWibDate(hint.startsAt)).toMatchObject({ weekday: 1, minutesOfDay: 4 * 60 + 30 });
  });

  it('menandai jadwal yang seharusnya sedang berlangsung tanpa mengklaim mengudara', () => {
    const hint = withoutNone(
      describeBroadcastSchedule(sundayAfternoon, [
        { ...schedule, dayOfWeek: 0, startTime: '15:30', durationMin: 60 },
      ]),
    );

    expect(hint.kind).toBe('IN_WINDOW');
    expect(hint.label).toBe('Seharusnya sedang berlangsung: Kajian Subuh · Minggu 15.30 WIB');
  });

  it('menangani pergantian hari dan jadwal malam', () => {
    // Minggu 23:50 WIB; jadwal Senin 23:30 masih beberapa jam lagi.
    const hint = withoutNone(
      describeBroadcastSchedule(new Date('2026-11-22T16:50:00Z'), [
        { ...schedule, startTime: '23:30' },
      ]),
    );

    expect(hint.kind).toBe('NEXT');
    expect(hint.label).toContain('Senin 23.30 WIB');
    expect(toWibDate(hint.startsAt)).toMatchObject({ day: 23, weekday: 1 });
  });

  it('menghitung hari Minggu sebagai hari pertama dalam sepekan', () => {
    // Sabtu 16:00 WIB.
    const hint = withoutNone(
      describeBroadcastSchedule(new Date('2026-11-21T09:00:00Z'), [{ ...schedule, dayOfWeek: 0 }]),
    );

    expect(hint.kind).toBe('NEXT');
    expect(hint.label).toContain('Minggu 04.30 WIB');
  });

  it('mengutamakan acara khusus yang lebih dekat', () => {
    const hint = withoutNone(
      describeBroadcastSchedule(sundayAfternoon, [
        { ...schedule, dayOfWeek: 3 },
        { ...schedule, title: 'Kajian Akbar', dayOfWeek: null, date: '2026-11-24' },
      ]),
    );

    expect(hint.kind).toBe('NEXT');
    expect(hint.title).toBe('Kajian Akbar');
    expect(hint.label).toBe('Berikutnya: Kajian Akbar, Selasa 04.30 WIB');
  });

  it('mengabaikan jadwal nonaktif, tanggal lewat, dan jadwal tanpa hari/tanggal', () => {
    expect(
      describeBroadcastSchedule(sundayAfternoon, [
        { ...schedule, isActive: false },
        { ...schedule, dayOfWeek: null, date: '2026-01-01' },
        { ...schedule, dayOfWeek: null, date: null },
      ]),
    ).toEqual({ kind: 'NONE' });
  });

  it('menggeser ke pekan berikutnya setelah acara selesai', () => {
    // Minggu 16:00 WIB; acara Minggu 04.30 durasi 60 menit sudah lewat.
    const hint = withoutNone(
      describeBroadcastSchedule(sundayAfternoon, [
        { ...schedule, dayOfWeek: 0, startTime: '04:30' },
      ]),
    );

    expect(hint.kind).toBe('NEXT');
    expect(toWibDate(hint.startsAt)).toMatchObject({ day: 29, weekday: 0 });
  });

  it('mengembalikan NONE bila tidak ada jadwal aktif', () => {
    expect(describeBroadcastSchedule(sundayAfternoon, [])).toEqual({ kind: 'NONE' });
  });
});
