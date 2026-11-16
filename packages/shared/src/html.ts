import { CONTENT_HTML_TAGS } from './constants/content.js';

/** Mencocokkan tag pembuka/penutup sederhana, bukan tanda `<` di teks biasa. */
const HTML_TAG_PATTERN = /<\/?([a-z][a-z0-9]*)(?:\s[^<>]*)?\/?>/gi;
const OPENING_TAG_PATTERN = /<([a-z][a-z0-9]*)\b[^>]*>/gi;

const ALLOWED_TAGS = new Set<string>(CONTENT_HTML_TAGS);

/**
 * True bila teks memuat markup seperti `<p>` atau `</strong>`. Perbandingan
 * biasa seperti `5 < 10` atau `a < b` tidak dianggap HTML.
 */
export function hasHtmlMarkup(value: string): boolean {
  return /<\/?[a-z][a-z0-9]*(?:\s[^<>]*)?\/?>/i.test(value);
}

/**
 * True bila teks memuat tag yang memang diizinkan untuk isi konten. Dipakai
 * saat merender: markup asing (misalnya `<script>`) tetap di-escape, bukan
 * dirender mentah.
 */
export function looksLikeContentHtml(value: string): boolean {
  for (const match of value.matchAll(HTML_TAG_PATTERN)) {
    const tag = match[1]?.toLowerCase();

    if (tag && ALLOWED_TAGS.has(tag)) {
      return true;
    }
  }

  return false;
}

/** Menghitung elemen pembuka, termasuk tag berbahaya, untuk batas node. */
export function countContentHtmlElements(value: string): number {
  return value.match(OPENING_TAG_PATTERN)?.length ?? 0;
}

/**
 * Merender isi konten untuk `dangerouslySetInnerHTML`: HTML yang sudah
 * disanitasi dipakai apa adanya, sedangkan teks polos lama di-escape dan
 * baris baru diubah menjadi `<br>`.
 */
export function renderContentBody(body: string): string {
  if (!body) return '';

  if (looksLikeContentHtml(body)) {
    return body;
  }

  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '<br>');
}
