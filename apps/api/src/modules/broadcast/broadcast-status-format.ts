import type { LiveStatus } from '@webdakwah/shared';

/**
 * Format respons status yang dikenali. Dipilih dari **struktur** respons, bukan
 * dari bentuk URL, agar admin bebas memakai alamat statistik apa pun.
 */
export type StatusFormat = 'SIMPLE' | 'SHOUTCAST' | 'ICECAST';

const SIMPLE_KEYS = ['live', 'isLive', 'is_live', 'online', 'onAir', 'on_air'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Membaca nilai boolean longgar: boolean, angka 1/0, atau teks "true"/"false".
 * Nilai lain dianggap tidak dikenali (null), bukan offline.
 */
function asFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 1 || value === 0)) return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on', 'live'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'offline'].includes(normalized)) return false;
  }

  return null;
}

/** Format sederhana: JSON datar dengan salah satu kunci boolean yang umum. */
function readSimple(record: Record<string, unknown>): LiveStatus | null {
  for (const key of SIMPLE_KEYS) {
    const flag = asFlag(record[key]);

    if (flag !== null) return flag ? 'LIVE' : 'OFFLINE';
  }

  return null;
}

/**
 * Statistik Shoutcast menyimpan status per stream pada `streamstatus`
 * (1 = mengudara, 0 = tidak). Bentuk contoh yang didukung:
 * `{ "streams": [{ "streamstatus": 1 }] }` atau `{ "streamstatus": 1 }`.
 */
function readShoutcast(record: Record<string, unknown>): LiveStatus | null {
  const candidates: Record<string, unknown>[] = [];

  if (Array.isArray(record.streams)) {
    for (const entry of record.streams) {
      if (isRecord(entry)) candidates.push(entry);
    }
  }

  candidates.push(record);

  const flags = candidates
    .map((entry) => asFlag(entry.streamstatus))
    .filter((flag): flag is boolean => flag !== null);

  if (flags.length === 0) return null;

  return flags.some(Boolean) ? 'LIVE' : 'OFFLINE';
}

/**
 * Statistik Icecast (`status-json.xsl`) membungkus data pada `icestats`.
 * Sumber siaran hanya ada selama penyiar terhubung, jadi keberadaan `source`
 * (objek atau array) menandakan siaran berjalan. Tidak ada sumber = offline.
 */
function readIcecast(record: Record<string, unknown>): LiveStatus | null {
  const stats = record.icestats;

  if (!isRecord(stats)) return null;

  const source = stats.source;

  // `icestats` ada tetapi tanpa sumber siaran berarti penyiar tidak terhubung.
  if (source === null || source === undefined) return 'OFFLINE';

  if (Array.isArray(source)) {
    return source.some((entry) => isRecord(entry)) ? 'LIVE' : 'OFFLINE';
  }

  return isRecord(source) ? 'LIVE' : null;
}

/** Menentukan adapter dari struktur JSON, tanpa menebak dari URL. */
export function detectStatusFormat(value: unknown): StatusFormat | null {
  if (!isRecord(value)) return null;

  // `icestats` paling khas; cek lebih dulu agar tidak tertangkap kunci sederhana.
  if ('icestats' in value) return readIcecast(value) === null ? null : 'ICECAST';

  if ('streamstatus' in value || Array.isArray(value.streams)) {
    return readShoutcast(value) === null ? null : 'SHOUTCAST';
  }

  return readSimple(value) === null ? null : 'SIMPLE';
}

/**
 * Menerjemahkan isi respons menjadi status siaran. JSON yang tidak dikenali,
 * teks asing, atau isi kosong menghasilkan UNKNOWN — bukan error.
 */
export function interpretStatus(text: string): LiveStatus {
  const trimmed = text.trim();

  if (!trimmed) return 'UNKNOWN';

  try {
    const json: unknown = JSON.parse(trimmed);

    if (isRecord(json)) {
      const status = readIcecast(json) ?? readShoutcast(json) ?? readSimple(json);

      if (status !== null) return status;
    }
  } catch {
    // Bukan JSON; coba teks sederhana di bawah.
  }

  const normalized = trimmed.toLowerCase();

  if (['live', 'on air', 'onair', 'online', '1', 'true'].includes(normalized)) {
    return 'LIVE';
  }

  if (['offline', 'off air', 'offair', 'off', '0', 'false'].includes(normalized)) {
    return 'OFFLINE';
  }

  return 'UNKNOWN';
}
