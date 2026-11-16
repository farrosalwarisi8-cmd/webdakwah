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
  it('membuang script, iframe, style, gambar, dan event handler', () => {
    const body = [
      '<p onclick="alert(1)">Halo <strong>dunia</strong></p>',
      '<script>alert(1)</script>',
      '<iframe src="https://contoh.com"></iframe>',
      '<style>body { color: red; }</style>',
      '<img src="https://contoh.com/x.png" onerror="alert(1)">',
    ].join('');

    expect(sanitizeContentBody(body)).toBe('<p>Halo <strong>dunia</strong></p>');
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
      sanitizeContentBodyForRead('<p onclick="alert(1)">Aman</p><script>alert(1)</script>'),
    ).toBe('<p>Aman</p>');
  });
});
