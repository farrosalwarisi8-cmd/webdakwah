import { z } from 'zod';

import { CONTENT_STATUSES, CONTENT_TYPES } from '../constants/content.js';
import { isSafeHttpUrl, paginationQuerySchema } from './common.js';

export const contentTitleSchema = z
  .string()
  .trim()
  .min(5, 'Judul minimal 5 karakter')
  .max(200, 'Judul maksimal 200 karakter');

export const contentExcerptSchema = z.string().trim().max(300, 'Ringkasan maksimal 300 karakter');

export const contentBodySchema = z.string().trim().max(50000, 'Isi maksimal 50.000 karakter');

/** Boleh kosong saat menyimpan draft, tetapi URL yang diisi wajib http/https. */
export const contentMediaUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL terlalu panjang')
  .refine(
    (value) => value === '' || isSafeHttpUrl(value),
    'URL harus diawali http:// atau https://',
  );

const contentFields = z.object({
  type: z.enum(CONTENT_TYPES),
  title: contentTitleSchema,
  excerpt: contentExcerptSchema.optional().default(''),
  body: contentBodySchema.optional().default(''),
  mediaUrl: contentMediaUrlSchema.optional().default(''),
});

/**
 * Validasi isian editor. Aturan wajib-isi bergantung pada jenis konten dan
 * diterapkan lagi saat "Ajukan review", supaya draft boleh belum lengkap.
 */
export const contentInputSchema = contentFields.superRefine((value, ctx) => {
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
});

export type ContentSummary = z.infer<typeof contentSummarySchema>;

export const contentDetailSchema = contentSummarySchema.extend({
  body: z.string().nullable(),
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
