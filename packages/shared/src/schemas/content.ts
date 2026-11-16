import { z } from 'zod';

import {
  CONTENT_BODY_MAX_ELEMENTS,
  CONTENT_BODY_MAX_LENGTH,
  CONTENT_LINK_TITLE_MAX_LENGTH,
  CONTENT_STATUSES,
  CONTENT_TRANSCRIPT_MAX_LENGTH,
  CONTENT_TYPES,
  MAX_CONTENT_LINKS_PER_CONTENT,
} from '../constants/content.js';
import { countContentHtmlElements } from '../html.js';
import { isSafeHttpUrl, paginationQuerySchema } from './common.js';
import { categoryIdsSchema, speakerIdSchema, tagNamesSchema } from './taxonomy.js';

export const contentTitleSchema = z
  .string()
  .trim()
  .min(5, 'Judul minimal 5 karakter')
  .max(200, 'Judul maksimal 200 karakter');

export const contentExcerptSchema = z.string().trim().max(300, 'Ringkasan maksimal 300 karakter');

export const contentBodySchema = z
  .string()
  .trim()
  .max(
    CONTENT_BODY_MAX_LENGTH,
    `Isi maksimal ${CONTENT_BODY_MAX_LENGTH.toLocaleString('id-ID')} karakter`,
  );

/** Transkrip audio berupa teks polos, disimpan tanpa markup HTML. */
export const contentTranscriptSchema = z
  .string()
  .trim()
  .max(
    CONTENT_TRANSCRIPT_MAX_LENGTH,
    `Transkrip maksimal ${CONTENT_TRANSCRIPT_MAX_LENGTH.toLocaleString('id-ID')} karakter`,
  );

/** Boleh kosong saat menyimpan draft, tetapi URL yang diisi wajib http/https. */
export const contentMediaUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL terlalu panjang')
  .refine(
    (value) => value === '' || isSafeHttpUrl(value),
    'URL harus diawali http:// atau https://',
  );

export const contentLinkTitleSchema = z
  .string()
  .trim()
  .min(1, 'Judul tautan wajib diisi')
  .max(
    CONTENT_LINK_TITLE_MAX_LENGTH,
    `Judul tautan maksimal ${CONTENT_LINK_TITLE_MAX_LENGTH} karakter`,
  );

export const contentLinkUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL terlalu panjang')
  .refine((value) => isSafeHttpUrl(value), 'URL harus diawali http:// atau https://');

export const contentLinkSchema = z.object({
  title: contentLinkTitleSchema,
  url: contentLinkUrlSchema,
  order: z.number().int().min(0).optional(),
});

export type ContentLinkInput = z.infer<typeof contentLinkSchema>;

export const contentLinksSchema = z
  .array(contentLinkSchema)
  .max(
    MAX_CONTENT_LINKS_PER_CONTENT,
    `Maksimal ${MAX_CONTENT_LINKS_PER_CONTENT} tautan terkait per konten`,
  );

const contentFields = z.object({
  type: z.enum(CONTENT_TYPES),
  title: contentTitleSchema,
  excerpt: contentExcerptSchema.optional().default(''),
  body: contentBodySchema.optional().default(''),
  transcript: contentTranscriptSchema.optional().default(''),
  mediaUrl: contentMediaUrlSchema.optional().default(''),
  categoryIds: categoryIdsSchema.optional().default([]),
  tagNames: tagNamesSchema.optional().default([]),
  speakerId: speakerIdSchema.optional().default(null),
  links: contentLinksSchema.optional().default([]),
});

/**
 * Validasi isian editor. Aturan wajib-isi bergantung pada jenis konten dan
 * diterapkan lagi saat "Ajukan review", supaya draft boleh belum lengkap.
 */
export const contentInputSchema = contentFields.superRefine((value, ctx) => {
  if (countContentHtmlElements(value.body) > CONTENT_BODY_MAX_ELEMENTS) {
    ctx.addIssue({
      code: 'custom',
      path: ['body'],
      message: `Isi maksimal ${CONTENT_BODY_MAX_ELEMENTS.toLocaleString('id-ID')} elemen HTML`,
    });
  }

  if (value.type === 'ARTICLE' && value.body.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['body'],
      message: 'Artikel wajib memiliki isi.',
    });
  }

  if (
    (value.type === 'AUDIO' || value.type === 'VIDEO' || value.type === 'LINK') &&
    value.mediaUrl.length === 0
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['mediaUrl'],
      message: 'Tautan media wajib diisi untuk jenis konten ini.',
    });
  }
});

export type ContentInput = z.infer<typeof contentInputSchema>;

/** Catatan wajib saat admin menolak konten, supaya penulis tahu apa yang harus diperbaiki. */
export const contentRejectSchema = z.object({
  reviewNote: z
    .string()
    .trim()
    .min(10, 'Catatan minimal 10 karakter')
    .max(500, 'Catatan maksimal 500 karakter'),
});

export type ContentRejectInput = z.infer<typeof contentRejectSchema>;

export const contentAuthorSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
});

export const contentSummarySchema = z.object({
  id: z.uuid(),
  type: z.enum(CONTENT_TYPES),
  status: z.enum(CONTENT_STATUSES),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  reviewNote: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: contentAuthorSchema,
  categories: z.array(z.object({ id: z.uuid(), name: z.string(), slug: z.string() })),
  tags: z.array(z.object({ id: z.uuid(), name: z.string(), slug: z.string() })),
  speaker: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }).nullable(),
});

export type ContentSummary = z.infer<typeof contentSummarySchema>;

export const contentLinkDetailSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  url: z.string(),
  order: z.number().int(),
});

export type ContentLinkDetail = z.infer<typeof contentLinkDetailSchema>;

export const contentDetailSchema = contentSummarySchema.extend({
  body: z.string().nullable(),
  transcript: z.string().nullable(),
  links: z.array(contentLinkDetailSchema),
});

export type ContentDetail = z.infer<typeof contentDetailSchema>;

export const contentListSchema = z.object({
  items: z.array(contentSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export type ContentList = z.infer<typeof contentListSchema>;

export const contentListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CONTENT_STATUSES).optional(),
});

export type ContentListQuery = z.infer<typeof contentListQuerySchema>;

/** Daftar kelola admin hanya berisi konten yang pernah/sedang terbit. */
export const managedContentQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

export type ManagedContentQuery = z.infer<typeof managedContentQuerySchema>;
