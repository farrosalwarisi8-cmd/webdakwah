import { BadRequestException } from '@nestjs/common';
import {
  CONTENT_BODY_MAX_ELEMENTS,
  countContentHtmlElements,
  hasHtmlMarkup,
  looksLikeContentHtml,
  renderContentBody,
} from '@webdakwah/shared';
import { describe, expect, it } from 'vitest';

import { sanitizeContentBody, sanitizeContentBodyForRead } from '../src/common/content-html.js';

describe('sanitizeContentBody', () => {
  it('membuang script, iframe, style, dan event handler, tetapi mempertahankan gambar aman', () => {
    const body = [
      '<p onclick="alert(1)">Halo <strong>dunia</strong></p>',
      '<script>alert(1)</script>',
      '<iframe src="https://contoh.com"></iframe>',
      '<style>body { color: red; }</style>',
      '<img src="https://contoh.com/x.png" alt="Gambar" onerror="alert(1)">',
    ].join('');

    const cleaned = sanitizeContentBody(body);

    expect(cleaned).toContain('<p>Halo <strong>dunia</strong></p>');
    expect(cleaned).toContain('<img src="https://contoh.com/x.png" alt="Gambar"');
    expect(cleaned).toContain('loading="lazy"');
    expect(cleaned).toContain('decoding="async"');
    expect(cleaned).toContain('referrerpolicy="no-referrer"');
    expect(cleaned).not.toContain('script');
    expect(cleaned).not.toContain('iframe');
    expect(cleaned).not.toContain('style');
    expect(cleaned).not.toContain('onerror');
    expect(cleaned).not.toContain('onclick');
  });

  it('membuang gambar dengan URL atau atribut tidak aman', () => {
    const cleaned = sanitizeContentBody(
      [
        '<p>Sebelum</p>',
        '<img src="javascript:alert(1)" alt="Jahat">',
        '<img src="data:image/svg+xml,<svg onload=alert(1)></svg>" alt="Data">',
        '<img src="//contoh.com/x.png" alt="Relatif">',
        '<img src="https://contoh.com/aman.png" style="width:9999px" width="9999" onerror="alert(1)">',
        '<p>Sesudah</p>',
      ].join(''),
    );

    expect(cleaned).toContain('<p>Sebelum</p>');
    expect(cleaned).toContain('<img src="https://contoh.com/aman.png"');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).not.toContain('data:');
    expect(cleaned).not.toContain('//contoh.com/x.png');
    expect(cleaned).not.toContain('style=');
    expect(cleaned).not.toContain('width=');
    expect(cleaned).not.toContain('onerror');
    expect((cleaned?.match(/<img\b/g) ?? []).length).toBe(1);
  });

  it('hanya mengizinkan tautan http/https dan menambahkan rel yang aman', () => {
    const cleaned = sanitizeContentBody(
      [
        '<p>',
        '<a href="https://contoh.com" onclick="alert(1)">Aman</a>',
        '<a href="javascript:alert(1)">Jahat</a>',
        '<a href="data:text/html,<script>alert(1)</script>">Data</a>',
        '<a href="//contoh.com">Relatif protokol</a>',
        '</p>',
      ].join(''),
    );

    expect(cleaned).toContain('href="https://contoh.com"');
    expect(cleaned).toContain('target="_blank"');
    expect(cleaned).toContain('rel="noopener noreferrer nofollow"');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).not.toContain('data:');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).not.toContain('href="//contoh.com"');
  });

  it('mempertahankan blok Ayat/Hadis dan arah RTL tanpa atribut asing', () => {
    const body = [
      '<div data-quote-block data-kind="HADITH" class="quote-block jahat" onclick="alert(1)">',
      '<p class="quote-source">Hadis · HR. Bukhari no. 1</p>',
      '<p class="quote-arabic" dir="rtl" lang="ar" style="color:red">إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</p>',
      '<p class="quote-translation" dir="ltr">Sesungguhnya amal bergantung pada niat.</p>',
      '<script>alert(1)</script>',
      '</div>',
    ].join('');

    const cleaned = sanitizeContentBody(body);

    expect(cleaned).toContain('data-quote-block');
    expect(cleaned).toContain('data-kind="HADITH"');
    expect(cleaned).toContain('class="quote-block"');
    expect(cleaned).toContain('dir="rtl"');
    expect(cleaned).toContain('lang="ar"');
    expect(cleaned).toContain('quote-translation');
    expect(cleaned).not.toContain('jahat');
    expect(cleaned).not.toContain('style=');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).not.toContain('script');
  });

  it('menormalkan jenis blok kutipan yang tidak dikenal', () => {
    const cleaned = sanitizeContentBody(
      '<div data-quote-block data-kind="SCRIPT"><p class="quote-arabic" dir="rtl">العلم</p></div>',
    );

    expect(cleaned).toContain('data-kind="AYAH"');
    expect(cleaned).not.toContain('SCRIPT');
  });

  it('mempertahankan tabel beserta colspan/rowspan dan membuang event handler', () => {
    const cleaned = sanitizeContentBody(
      [
        '<table onmouseover="alert(1)">',
        '<thead><tr><th colspan="2" onclick="alert(1)">Judul</th></tr></thead>',
        '<tbody><tr><td rowspan="2">Isi</td><td>Nilai</td></tr></tbody>',
        '</table>',
      ].join(''),
    );

    expect(cleaned).toContain('<table>');
    expect(cleaned).toContain('colspan="2"');
    expect(cleaned).toContain('rowspan="2"');
    expect(cleaned).toContain('<th colspan="2">Judul</th>');
    expect(cleaned).not.toContain('onmouseover');
    expect(cleaned).not.toContain('onclick');
  });

  it('mempertahankan teks polos lama yang memuat tanda lebih kecil', () => {
    const plain = 'Nilai 5 < 10 dan a < b.\nBaris kedua.';

    expect(hasHtmlMarkup(plain)).toBe(false);
    expect(looksLikeContentHtml(plain)).toBe(false);
    expect(sanitizeContentBody(plain)).toBe(plain);
    expect(renderContentBody(plain)).toBe('Nilai 5 &lt; 10 dan a &lt; b.<br>Baris kedua.');
  });

  it('meng-escape markup berbahaya yang tidak termasuk allowlist saat dirender', () => {
    const body = '<script>alert(1)</script>';

    expect(looksLikeContentHtml(body)).toBe(false);
    expect(renderContentBody(body)).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('menghitung elemen HTML untuk batas node', () => {
    expect(countContentHtmlElements('<p>satu</p><p>dua</p>')).toBe(2);
  });

  it('menolak body yang melebihi batas jumlah elemen', () => {
    const body = '<p>x</p>'.repeat(CONTENT_BODY_MAX_ELEMENTS + 1);

    expect(() => sanitizeContentBody(body)).toThrow(BadRequestException);
  });

  it('membersihkan data kotor pada jalur baca tanpa melempar error', () => {
    expect(
      sanitizeContentBodyForRead(
        '<p onclick="alert(1)">Aman</p><img src="javascript:alert(1)"><script>alert(1)</script>',
      ),
    ).toBe('<p>Aman</p>');
  });
});
