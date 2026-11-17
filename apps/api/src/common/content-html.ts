import { BadRequestException } from '@nestjs/common';
import {
  CONTENT_BODY_MAX_ELEMENTS,
  CONTENT_BODY_MAX_LENGTH,
  CONTENT_HTML_TAGS,
  countContentHtmlElements,
  hasHtmlMarkup,
  isSafeHttpUrl,
} from '@webdakwah/shared';
import sanitizeHtml from 'sanitize-html';

const LINK_REL = 'noopener noreferrer nofollow';

/** Atribut tautan yang diizinkan; target/rel dipasang ulang oleh transformasi. */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [...CONTENT_HTML_TAGS],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'decoding', 'referrerpolicy'],
    div: ['class', 'data-quote-block', 'data-kind'],
    p: ['class', 'dir', 'lang'],
    h2: ['dir', 'lang'],
    h3: ['dir', 'lang'],
    h4: ['dir', 'lang'],
    blockquote: ['dir', 'lang'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedClasses: {
    div: ['quote-block'],
    p: ['quote-source', 'quote-arabic', 'quote-translation'],
  },
  allowedSchemes: ['http', 'https'],
  allowedSchemesByTag: {
    a: ['http', 'https'],
    img: ['http', 'https'],
  },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed'],
  exclusiveFilter: (frame) =>
    frame.tag === 'img' &&
    (typeof frame.attribs.src !== 'string' || !isSafeHttpUrl(frame.attribs.src)),
  transformTags: {
    div: (tagName, attribs) => {
      if (!('data-quote-block' in attribs)) {
        return { tagName, attribs: {} as Record<string, string> };
      }

      return {
        tagName,
        attribs: {
          class: 'quote-block',
          'data-quote-block': '',
          'data-kind': attribs['data-kind'] === 'HADITH' ? 'HADITH' : 'AYAH',
        },
      };
    },
    a: (tagName, attribs) => {
      const href = attribs.href;

      if (typeof href !== 'string' || !isSafeHttpUrl(href)) {
        const cleaned = { ...attribs };
        delete cleaned.href;
        delete cleaned.target;
        delete cleaned.rel;

        return { tagName, attribs: cleaned };
      }

      return {
        tagName,
        attribs: { ...attribs, href, target: '_blank', rel: LINK_REL },
      };
    },
    img: (tagName, attribs) => {
      const src = attribs.src;

      if (typeof src !== 'string' || !isSafeHttpUrl(src)) {
        const cleaned = { ...attribs };
        delete cleaned.src;

        return { tagName, attribs: cleaned };
      }

      return {
        tagName,
        attribs: {
          ...attribs,
          src,
          loading: 'lazy',
          decoding: 'async',
          referrerpolicy: 'no-referrer',
        },
      };
    },
  },
};

/**
 * Sanitasi jalur tulis. Body yang tidak memuat markup dibiarkan sebagai teks
 * polos (di-escape saat dirender), sedangkan HTML dibersihkan dengan allowlist.
 */
export function sanitizeContentBody(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) return null;

  if (trimmed.length > CONTENT_BODY_MAX_LENGTH) {
    throw new BadRequestException(
      `Isi maksimal ${CONTENT_BODY_MAX_LENGTH.toLocaleString('id-ID')} karakter.`,
    );
  }

  if (countContentHtmlElements(trimmed) > CONTENT_BODY_MAX_ELEMENTS) {
    throw new BadRequestException(
      `Isi maksimal ${CONTENT_BODY_MAX_ELEMENTS.toLocaleString('id-ID')} elemen HTML.`,
    );
  }

  if (!hasHtmlMarkup(trimmed)) {
    return trimmed;
  }

  const cleaned = sanitizeHtml(trimmed, sanitizeOptions).trim();

  return cleaned || null;
}

/**
 * Sanitasi jalur baca untuk data lama atau yang tersimpan sebelum aturan ini.
 * Tidak melempar error agar halaman publik tetap bisa tampil.
 */
export function sanitizeContentBodyForRead(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) return null;

  if (!hasHtmlMarkup(trimmed)) {
    return trimmed;
  }

  const cleaned = sanitizeHtml(trimmed, sanitizeOptions).trim();

  return cleaned || null;
}
