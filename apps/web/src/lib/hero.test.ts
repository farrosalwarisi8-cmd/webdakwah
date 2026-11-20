import { describe, expect, it } from 'vitest';

import { HERO_AYAT, isHeroAyatComplete, type HeroAyat } from './hero';

const completeAyat: HeroAyat = {
  arab: 'contoh teks arab',
  terjemahan: 'contoh terjemahan',
  sumber: 'Contoh 1:1',
  verifiedBy: 'Tim Uji',
  verifiedAt: '2026-01-01',
};

describe('konfigurasi HERO_AYAT', () => {
  it('null, atau lengkap termasuk verifiedBy dan verifiedAt', () => {
    expect(HERO_AYAT === null || isHeroAyatComplete(HERO_AYAT)).toBe(true);
  });

  it('menerima data lengkap', () => {
    expect(isHeroAyatComplete(completeAyat)).toBe(true);
  });

  it('menolak data kosong atau kolom yang belum diisi', () => {
    expect(isHeroAyatComplete(null)).toBe(false);

    for (const key of Object.keys(completeAyat) as (keyof HeroAyat)[]) {
      expect(isHeroAyatComplete({ ...completeAyat, [key]: '   ' })).toBe(false);
    }
  });
});
