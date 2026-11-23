import { describe, expect, it } from 'vitest';

import {
  cleanText,
  contactChannels,
  contactEmailHref,
  legalReviewStatus,
  managerName,
  retentionLabel,
  SITE_OWNER,
  whatsappDigits,
  type SiteOwner,
} from './site';

function owner(overrides: Partial<SiteOwner> = {}): SiteOwner {
  return { ...SITE_OWNER, ...overrides };
}

describe('data pemilik situs bawaan', () => {
  it('sengaja kosong agar tidak ada data karangan yang tampil', () => {
    expect(SITE_OWNER).toEqual({
      managerName: null,
      address: null,
      contactEmail: null,
      contactWhatsapp: null,
      retentionDays: null,
      legalReviewedAt: null,
    });
  });
});

describe('cleanText', () => {
  it('membuang spasi tepi dan menganggap kosong sebagai null', () => {
    expect(cleanText('  Ustadz A  ')).toBe('Ustadz A');
    expect(cleanText('   ')).toBeNull();
    expect(cleanText(null)).toBeNull();
    expect(cleanText(undefined)).toBeNull();
  });
});

describe('kontak', () => {
  it('hanya menautkan email yang bentuknya sah', () => {
    expect(contactEmailHref(' admin@contoh.test ')).toBe('mailto:admin@contoh.test');

    for (const invalid of [null, '', 'bukan-email', 'admin@contoh', 'a@b', 'admin @contoh.test']) {
      expect(contactEmailHref(invalid)).toBeNull();
    }
  });

  it('menolak nomor WhatsApp lokal atau terlalu pendek', () => {
    expect(whatsappDigits('6281234567890')).toBe('6281234567890');
    expect(whatsappDigits('+62 812-3456-7890')).toBe('6281234567890');

    for (const invalid of [null, '', '081234567890', '123', 'abc']) {
      expect(whatsappDigits(invalid)).toBeNull();
    }
  });

  it('menyembunyikan kanal yang belum diisi', () => {
    expect(contactChannels(owner())).toEqual([]);
  });

  it('menghilangkan kanal tidak sah tanpa menggeser kanal lain', () => {
    const channels = contactChannels(
      owner({ contactEmail: 'rusak', contactWhatsapp: '6281234567890' }),
    );

    expect(channels).toEqual([
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        value: '+6281234567890',
        href: 'https://wa.me/6281234567890',
      },
    ]);
  });

  it('menampilkan email, WhatsApp, dan alamat berurutan', () => {
    const channels = contactChannels(
      owner({
        contactEmail: 'admin@contoh.test',
        contactWhatsapp: '6281234567890',
        address: 'Jalan Contoh 1',
      }),
    );

    expect(channels.map((channel) => channel.key)).toEqual(['email', 'whatsapp', 'address']);
    expect(channels[0]?.href).toBe('mailto:admin@contoh.test');
    expect(channels[2]).toEqual({
      key: 'address',
      label: 'Alamat',
      value: 'Jalan Contoh 1',
      href: null,
    });
  });

  it('menampilkan nama pengelola hanya bila diisi', () => {
    expect(managerName()).toBeNull();
    expect(managerName(owner({ managerName: '  Yayasan Contoh ' }))).toBe('Yayasan Contoh');
  });
});

describe('status tinjauan kebijakan', () => {
  it('dianggap draf selama tanggal tinjauan kosong atau tidak sah', () => {
    expect(legalReviewStatus(owner())).toEqual({ isDraft: true, reviewedAt: null });
    expect(legalReviewStatus(owner({ legalReviewedAt: '   ' })).isDraft).toBe(true);
    expect(legalReviewStatus(owner({ legalReviewedAt: 'bukan-tanggal' })).isDraft).toBe(true);
  });

  it('berhenti menjadi draf setelah tanggal tinjauan yang sah diisi', () => {
    expect(legalReviewStatus(owner({ legalReviewedAt: '2026-11-20' }))).toEqual({
      isDraft: false,
      reviewedAt: '2026-11-20',
    });
  });
});

describe('retentionLabel', () => {
  it('memakai angka dari pemilik bila wajar', () => {
    expect(retentionLabel(owner({ retentionDays: 90 }))).toContain('90 hari');
  });

  it('tidak menebak masa simpan bila kosong atau tidak masuk akal', () => {
    for (const days of [null, 0, -5, 1.5]) {
      expect(retentionLabel(owner({ retentionDays: days }))).toContain('Belum ditetapkan');
    }
  });
});
