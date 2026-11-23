import { describe, expect, it } from 'vitest';

import { contentPageUrl, isOfflineCacheablePath } from './pwa';

describe('aturan cache offline', () => {
  it('mengizinkan halaman publik dan simpanan', () => {
    expect(isOfflineCacheablePath('/')).toBe(true);
    expect(isOfflineCacheablePath('/artikel/adab-menuntut-ilmu')).toBe(true);
    expect(isOfflineCacheablePath('/simpanan')).toBe(true);
    expect(isOfflineCacheablePath('/offline')).toBe(true);
  });

  it('menolak halaman privat', () => {
    expect(isOfflineCacheablePath('/dashboard')).toBe(false);
    expect(isOfflineCacheablePath('/dashboard/konten/123')).toBe(false);
    expect(isOfflineCacheablePath('/masuk')).toBe(false);
    expect(isOfflineCacheablePath('/daftar')).toBe(false);
    expect(isOfflineCacheablePath('/auth/konfirmasi')).toBe(false);
    expect(isOfflineCacheablePath('/akun')).toBe(false);
    expect(isOfflineCacheablePath('/api/revalidate')).toBe(false);
    expect(isOfflineCacheablePath('/lupa-sandi')).toBe(false);
    expect(isOfflineCacheablePath('/atur-sandi')).toBe(false);
  });

  it('tidak salah mencocokkan awalan yang mirip', () => {
    expect(isOfflineCacheablePath('/akun-publik')).toBe(true);
    expect(isOfflineCacheablePath('/masukan')).toBe(true);
  });
});

describe('contentPageUrl', () => {
  it('membentuk URL detail sesuai jenis konten', () => {
    expect(contentPageUrl('ARTICLE', 'adab')).toBe('/artikel/adab');
    expect(contentPageUrl('AUDIO', 'kajian sabar')).toBe('/audio/kajian%20sabar');
    expect(contentPageUrl('VIDEO', 'video-1')).toBe('/video/video-1');
    expect(contentPageUrl('LINK', 'rujukan-1')).toBe('/rujukan/rujukan-1');
  });
});
