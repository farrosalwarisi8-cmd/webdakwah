import snapshotFile from '../../data/public-snapshot.json';

/** Bentuk berkas cadangan yang dibuat `pnpm snapshot:public`. */
export interface PublicSnapshotFile {
  generatedAt: string | null;
  responses: Record<string, unknown>;
}

const EMPTY_SNAPSHOT: PublicSnapshotFile = { generatedAt: null, responses: {} };

function readSnapshotFile(value: unknown): PublicSnapshotFile {
  if (typeof value !== 'object' || value === null) return EMPTY_SNAPSHOT;

  const { generatedAt, responses } = value as Partial<PublicSnapshotFile>;

  if (typeof responses !== 'object' || responses === null || Array.isArray(responses)) {
    return EMPTY_SNAPSHOT;
  }

  return {
    generatedAt: typeof generatedAt === 'string' ? generatedAt : null,
    responses: responses as Record<string, unknown>,
  };
}

const snapshot = readSnapshotFile(snapshotFile);

/** Tanggal pembuatan cadangan, `null` bila berkas masih kosong. */
export function snapshotGeneratedAt(): string | null {
  return snapshot.generatedAt;
}

/**
 * Urutkan parameter query agar kunci snapshot sama walau urutan parameter di
 * kode berubah. Dipakai juga oleh `scripts/snapshot-public.mjs`.
 */
export function normalizeSnapshotPath(path: string): string {
  const [pathname = '', search = ''] = path.split('?');

  if (!search) return pathname;

  const params = new URLSearchParams(search);
  params.sort();
  const sorted = params.toString();

  return sorted ? `${pathname}?${sorted}` : pathname;
}

/**
 * Cadangan hanya dipakai saat build: HTML hasil build tetap berisi konten
 * terakhir walau API sedang mati. Di runtime, revalidasi dan cache ISR yang
 * menjaga konten tetap tampil, sehingga konten yang sudah diarsipkan tidak
 * muncul kembali hanya karena API gagal sesaat.
 */
export function isSnapshotFallbackActive(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.PUBLIC_SNAPSHOT_FALLBACK === 'off') return false;
  if (env.PUBLIC_SNAPSHOT_FALLBACK === 'always') return true;

  return env.NEXT_PHASE === 'phase-production-build';
}

/** Jawaban cadangan untuk satu path API, `null` bila tidak terekam. */
export function getSnapshotResponse(
  path: string,
  responses: Record<string, unknown> = snapshot.responses,
): unknown {
  const key = normalizeSnapshotPath(path);

  if (!Object.hasOwn(responses, key)) return null;

  return responses[key] ?? null;
}
