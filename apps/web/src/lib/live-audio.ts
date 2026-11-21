import { formatDuration } from './format';

export const LIVE_TRACK_SLUG = 'siaran-langsung';

export const LIVE_TRACK_TITLE_FALLBACK = 'Siaran Langsung';

/** Bentuk minimal trek yang dibutuhkan helper; tidak mengimpor provider React. */
export interface TrackLike {
  slug: string;
  title: string;
  speaker: string;
  src: string;
  isLive?: boolean;
}

/** Trek siaran dikenali dari penanda `isLive`, dengan slug lama sebagai cadangan. */
export function isLiveTrack(track: Pick<TrackLike, 'slug' | 'isLive'>): boolean {
  return track.isLive === true || track.slug === LIVE_TRACK_SLUG;
}

/** Halaman tujuan tautan pemutar: siaran selalu ke /siaran, bukan halaman audio. */
export function trackHref(track: Pick<TrackLike, 'slug' | 'isLive'>): string {
  return isLiveTrack(track) ? '/siaran' : `/audio/${track.slug}`;
}

/**
 * Durasi yang aman ditampilkan. Stream langsung sering melaporkan `Infinity`;
 * nilai tak hingga, NaN, atau negatif tidak boleh muncul di UI.
 */
export function safeDuration(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export interface TrackMetaInput {
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  ended: boolean;
}

/**
 * Baris keterangan mini-player. Untuk siaran, waktu dan durasi tidak pernah
 * ditampilkan karena tidak bermakna pada stream langsung.
 */
export function formatTrackMeta(track: TrackLike, input: TrackMetaInput): string {
  if (isLiveTrack(track)) {
    return input.isBuffering ? 'LANGSUNG · memuat…' : 'LANGSUNG';
  }

  const duration = safeDuration(input.duration);
  const current = safeDuration(input.currentTime);
  const timing =
    duration > 0
      ? `${formatDuration(current)} / ${formatDuration(duration)}`
      : formatDuration(current);

  let meta = `${track.speaker} · ${timing}`;

  if (input.isBuffering) meta += ' · memuat…';
  if (input.ended) meta += ' · selesai';

  return meta;
}

/** Pesan galat khusus siaran; trek biasa memakai pesan umum pemutar. */
export const LIVE_ERROR_MESSAGE = 'Siaran sedang tidak mengudara. Lihat jadwal di bawah.';

export function playbackErrorMessage(track: Pick<TrackLike, 'slug' | 'isLive'> | null): string {
  if (track && isLiveTrack(track)) return LIVE_ERROR_MESSAGE;

  return 'Audio tidak dapat diputar. Coba buka sumber aslinya.';
}

/** Lebar progres 0–100; siaran tidak menampilkan progres sama sekali. */
export function progressPercent(
  track: Pick<TrackLike, 'slug' | 'isLive'>,
  currentTime: number,
  duration: number,
): number {
  if (isLiveTrack(track)) return 0;

  const total = safeDuration(duration);

  if (total === 0) return 0;

  return Math.min(100, Math.max(0, (safeDuration(currentTime) / total) * 100));
}
