/**
 * Pengenalan tautan video pihak ketiga yang boleh disematkan.
 *
 * Hanya YouTube, TikTok, dan Instagram yang dikenali. URL iframe dibangun
 * ulang dari ID yang sudah divalidasi, bukan dari URL asli, sehingga host dan
 * parameter tambahan dari pengguna tidak pernah masuk ke atribut `src`.
 */

export type VideoEmbedProvider = 'youtube' | 'tiktok' | 'instagram';

export type VideoEmbedAspectRatio = '16 / 9' | '9 / 16' | '4 / 5';

export interface VideoEmbed {
  provider: VideoEmbedProvider;
  providerLabel: string;
  embedUrl: string;
  aspectRatio: VideoEmbedAspectRatio;
  /** URL asli, dipakai tombol cadangan "Tonton di sumber asli". */
  sourceUrl: string;
}

export const VIDEO_SOURCE_ERROR_MESSAGE =
  'Tautan video harus dari YouTube, TikTok, atau Instagram, atau berkas video (mp4/webm).';

const EXTENSION_BERKAS_VIDEO = ['.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.mov'];

const HOST_YOUTUBE = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
]);
const HOST_YOUTUBE_NOCOOKIE = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);
const HOST_TIKTOK = new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com']);
const HOST_INSTAGRAM = new Set(['instagram.com', 'www.instagram.com']);

const POLA_ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const POLA_ID_TIKTOK = /^\d{6,25}$/;
const POLA_SHORTCODE_INSTAGRAM = /^[A-Za-z0-9_-]{5,20}$/;

function hostDari(url: URL): string {
  return url.hostname.toLowerCase().replace(/\.$/, '');
}

/**
 * URL sumber yang sah: http/https, tanpa kredensial tertanam, tanpa port
 * khusus. Kredensial seperti `https://user:pass@youtube.com/...` ditolak
 * supaya tidak bisa disalahgunakan untuk menyamarkan host.
 */
function parseUrlSumber(value: string): URL | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '') return null;
  if (url.port !== '') return null;

  return url;
}

function idYoutube(url: URL): string | null {
  const host = hostDari(url);
  let kandidat: string | null = null;

  if (host === 'youtu.be') {
    kandidat = url.pathname.slice(1).replace(/\/$/, '');
  } else if (HOST_YOUTUBE_NOCOOKIE.has(host)) {
    kandidat = /^\/embed\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
  } else if (HOST_YOUTUBE.has(host)) {
    if (url.pathname === '/watch') {
      kandidat = url.searchParams.get('v');
    } else {
      kandidat = /^\/(?:shorts|embed|live|v)\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    }
  }

  return kandidat !== null && POLA_ID_YOUTUBE.test(kandidat) ? kandidat : null;
}

function idTiktok(url: URL): string | null {
  if (!HOST_TIKTOK.has(hostDari(url))) return null;

  const jalur = url.pathname;
  const kandidat =
    /^\/@[^/]+\/video\/([^/]+)\/?$/.exec(jalur)?.[1] ??
    /^\/video\/([^/]+)\/?$/.exec(jalur)?.[1] ??
    /^\/embed\/v2\/([^/]+)\/?$/.exec(jalur)?.[1] ??
    null;

  return kandidat !== null && POLA_ID_TIKTOK.test(kandidat) ? kandidat : null;
}

function instagram(url: URL): { kind: 'reel' | 'p' | 'tv'; shortcode: string } | null {
  if (!HOST_INSTAGRAM.has(hostDari(url))) return null;

  const cocok = /^\/(reel|reels|p|tv)\/([^/]+)\/?$/.exec(url.pathname);
  if (!cocok) return null;

  const shortcode = cocok[2];
  if (!shortcode || !POLA_SHORTCODE_INSTAGRAM.test(shortcode)) return null;

  const kind = cocok[1] === 'reels' ? 'reel' : (cocok[1] as 'reel' | 'p' | 'tv');

  return { kind, shortcode };
}

/**
 * Mengubah tautan video yang didukung menjadi data embed. Mengembalikan
 * `null` untuk host asing, tautan pendek yang tidak bisa diverifikasi
 * (mis. `vm.tiktok.com`), atau ID yang tidak valid.
 */
export function getVideoEmbed(value: string): VideoEmbed | null {
  const url = parseUrlSumber(value.trim());
  if (!url) return null;

  const youtube = idYoutube(url);
  if (youtube) {
    return {
      provider: 'youtube',
      providerLabel: 'YouTube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}`,
      aspectRatio: '16 / 9',
      sourceUrl: url.toString(),
    };
  }

  const tiktok = idTiktok(url);
  if (tiktok) {
    return {
      provider: 'tiktok',
      providerLabel: 'TikTok',
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktok}`,
      aspectRatio: '9 / 16',
      sourceUrl: url.toString(),
    };
  }

  const ig = instagram(url);
  if (ig) {
    return {
      provider: 'instagram',
      providerLabel: 'Instagram',
      embedUrl: `https://www.instagram.com/${ig.kind}/${ig.shortcode}/embed/`,
      aspectRatio: ig.kind === 'reel' ? '9 / 16' : ig.kind === 'p' ? '4 / 5' : '16 / 9',
      sourceUrl: url.toString(),
    };
  }

  return null;
}

/** Berkas video yang diunggah ke R2 dan diputar dengan elemen `<video>`. */
export function isDirectVideoFileUrl(value: string): boolean {
  const url = parseUrlSumber(value.trim());
  if (!url) return false;

  const jalur = url.pathname.toLowerCase();

  return EXTENSION_BERKAS_VIDEO.some((ekstensi) => jalur.endsWith(ekstensi));
}

/** Sumber video yang sah untuk jenis konten VIDEO. */
export function isSupportedVideoSource(value: string): boolean {
  return getVideoEmbed(value) !== null || isDirectVideoFileUrl(value);
}
