/**
 * Siaran langsung radio mitra. Server radio tidak dibuat di proyek ini:
 * website hanya menampilkan alamat dengar publik dan jadwal.
 */

export const PLAY_MODES = ['EMBED', 'EXTERNAL'] as const;

export type PlayMode = (typeof PLAY_MODES)[number];

export const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  EMBED: 'Diputar di halaman ini',
  EXTERNAL: 'Buka di radio (tab baru)',
};

/** Nama hari dalam Bahasa Indonesia, indeks 0 = Minggu. */
export const DAY_OF_WEEK_LABELS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

/** Zona waktu jadwal siaran; semua jam pada model jadwal adalah WIB. */
export const BROADCAST_TIMEZONE = 'Asia/Jakarta';
export const BROADCAST_TIMEZONE_LABEL = 'WIB';

/** Batas jumlah jadwal terdekat yang dikirim ke halaman publik. */
export const PUBLIC_SCHEDULE_LIMIT = 8;
