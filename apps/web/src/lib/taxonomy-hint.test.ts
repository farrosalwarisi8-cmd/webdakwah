import { describe, expect, it } from 'vitest';

import { emptyCategoryHint } from './taxonomy-hint';

describe('emptyCategoryHint', () => {
  it('mengarahkan admin ke halaman taksonomi', () => {
    const hint = emptyCategoryHint('ADMIN');

    expect(hint.action).toEqual({
      href: '/dashboard/taksonomi',
      label: 'Buka halaman Taksonomi',
    });
    expect(hint.message).toContain('Belum ada kategori');
  });

  it('meminta kontributor menghubungi admin tanpa tautan', () => {
    const hint = emptyCategoryHint('CONTRIBUTOR');

    expect(hint.action).toBeNull();
    expect(hint.message).toBe('Belum ada kategori, hubungi admin.');
  });

  it('memberi pesan aman saat peran tidak diketahui', () => {
    const hint = emptyCategoryHint(null);

    expect(hint.action).toBeNull();
    expect(hint.message).toBe('Belum ada kategori, hubungi admin.');
  });
});
