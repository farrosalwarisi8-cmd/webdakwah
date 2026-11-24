import { describe, expect, it } from 'vitest';

import snapshotFile from '../../data/public-snapshot.json';
import {
  getSnapshotResponse,
  isSnapshotFallbackActive,
  normalizeSnapshotPath,
  snapshotGeneratedAt,
} from './public-snapshot';

describe('normalizeSnapshotPath', () => {
  it('mengurutkan parameter query agar kunci stabil', () => {
    expect(normalizeSnapshotPath('/public/contents?pageSize=50&page=2')).toBe(
      '/public/contents?page=2&pageSize=50',
    );
  });

  it('tidak menambah tanda tanya bila tidak ada query', () => {
    expect(normalizeSnapshotPath('/public/highlights')).toBe('/public/highlights');
  });
});

describe('getSnapshotResponse', () => {
  const responses = {
    '/public/highlights': { ARTICLE: null, AUDIO: null, VIDEO: null, LINK: null },
    '/public/latest?limit=9': { items: [{ id: 'contoh' }] },
  };

  it('menemukan jawaban walau urutan query berbeda', () => {
    expect(getSnapshotResponse('/public/latest?limit=9', responses)).toEqual({
      items: [{ id: 'contoh' }],
    });
    expect(getSnapshotResponse('/public/latest?limit=9&', responses)).not.toBeUndefined();
  });

  it('mengembalikan null untuk path yang tidak terekam', () => {
    expect(getSnapshotResponse('/public/contents?page=1', responses)).toBeNull();
  });

  it('tidak melempar untuk kunci bernilai null', () => {
    expect(getSnapshotResponse('/public/live', { '/public/live': null })).toBeNull();
  });
});

describe('isSnapshotFallbackActive', () => {
  it('aktif hanya saat build produksi', () => {
    expect(isSnapshotFallbackActive({ NEXT_PHASE: 'phase-production-build' })).toBe(true);
    expect(isSnapshotFallbackActive({ NEXT_PHASE: 'phase-production-server' })).toBe(false);
    expect(isSnapshotFallbackActive({})).toBe(false);
  });

  it('bisa dipaksa atau dimatikan lewat PUBLIC_SNAPSHOT_FALLBACK', () => {
    expect(isSnapshotFallbackActive({ PUBLIC_SNAPSHOT_FALLBACK: 'always' })).toBe(true);
    expect(
      isSnapshotFallbackActive({
        NEXT_PHASE: 'phase-production-build',
        PUBLIC_SNAPSHOT_FALLBACK: 'off',
      }),
    ).toBe(false);
  });
});

describe('berkas cadangan', () => {
  it('punya bentuk yang bisa dibaca', () => {
    expect(typeof snapshotFile.responses).toBe('object');
    expect(snapshotFile.responses).not.toBeNull();
    expect(Array.isArray(snapshotFile.responses)).toBe(false);

    const generatedAt = snapshotGeneratedAt();

    expect(generatedAt === null || !Number.isNaN(Date.parse(generatedAt))).toBe(true);
  });
});
