import { describe, expect, it } from 'vitest';

import { buildSharePayload, canonicalContentUrl, isShareable, whatsappShareUrl } from './share';

describe('isShareable', () => {
  it('hanya artikel, audio, dan video yang bisa dibagikan', () => {
    expect(isShareable('ARTICLE')).toBe(true);
    expect(isShareable('AUDIO')).toBe(true);
    expect(isShareable('VIDEO')).toBe(true);
    expect(isShareable('LINK')).toBe(false);
  });
});

describe('canonicalContentUrl', () => {
  it('membentuk URL absolut dari slug dan URL situs', () => {
    expect(canonicalContentUrl('ARTICLE', 'menjaga-lisan', 'https://webdakwah.test')).toBe(
      'https://webdakwah.test/artikel/menjaga-lisan',
    );
    expect(canonicalContentUrl('AUDIO', 'kajian-sabar', 'https://webdakwah.test/')).toBe(
      'https://webdakwah.test/audio/kajian-sabar',
    );
    expect(canonicalContentUrl('VIDEO', 'adab-majelis', 'https://webdakwah.test')).toBe(
      'https://webdakwah.test/video/adab-majelis',
    );
  });

  it('mengenkode slug agar URL tetap sah', () => {
    expect(canonicalContentUrl('ARTICLE', 'judul dengan spasi', 'https://webdakwah.test')).toBe(
      'https://webdakwah.test/artikel/judul%20dengan%20spasi',
    );
  });

  it('memakai URL lokal hanya bila URL situs tidak diisi', () => {
    expect(canonicalContentUrl('ARTICLE', 'contoh', undefined)).toBe(
      'http://localhost:3000/artikel/contoh',
    );
    expect(canonicalContentUrl('ARTICLE', 'contoh', '   ')).toBe(
      'http://localhost:3000/artikel/contoh',
    );
  });

  it('tidak menebak alamat bila URL situs tidak sah', () => {
    expect(canonicalContentUrl('ARTICLE', 'contoh', 'bukan-url')).toBe('/artikel/contoh');
  });
});

describe('whatsappShareUrl', () => {
  it('menggabungkan judul dan URL dalam satu pesan terenkode', () => {
    const href = whatsappShareUrl('Menjaga Lisan & Hati', 'https://webdakwah.test/artikel/x');
    const message = new URL(href).searchParams.get('text');

    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(message).toBe('Menjaga Lisan & Hati\nhttps://webdakwah.test/artikel/x');
  });

  it('membuang spasi tepi judul dan tidak menyisakan baris kosong', () => {
    const href = whatsappShareUrl('  ', 'https://webdakwah.test/artikel/x');

    expect(new URL(href).searchParams.get('text')).toBe('https://webdakwah.test/artikel/x');
  });
});

describe('buildSharePayload', () => {
  it('mempertahankan judul dan URL apa adanya', () => {
    expect(buildSharePayload('  Judul Kajian ', 'https://webdakwah.test/audio/x')).toEqual({
      title: 'Judul Kajian',
      url: 'https://webdakwah.test/audio/x',
      whatsappUrl: 'https://wa.me/?text=Judul%20Kajian%0Ahttps%3A%2F%2Fwebdakwah.test%2Faudio%2Fx',
    });
  });

  it('memakai judul cadangan bila judul kosong', () => {
    expect(buildSharePayload('   ', 'https://webdakwah.test/artikel/x').title).toBe('WebDakwah');
  });
});
