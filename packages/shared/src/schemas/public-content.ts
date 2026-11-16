import { z } from 'zod';

import { CONTENT_TYPES } from '../constants/content.js';
import { paginationQuerySchema } from './common.js';
import { publicCategorySchema, publicSpeakerSchema, publicTagSchema } from './taxonomy.js';

/**
 * Bentuk data untuk pengunjung publik. Sengaja tidak memuat email penulis,
 * catatan review, maupun status internal agar tidak bocor lewat halaman publik.
 */
export const publicAuthorSchema = z.object({
  fullName: z.string().nullable(),
});

export const publicContentSummarySchema = z.object({
  id: z.uuid(),
  type: z.enum(CONTENT_TYPES),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  publishedAt: z.string().nullable(),
  author: publicAuthorSchema,
  categories: z.array(publicCategorySchema),
  tags: z.array(publicTagSchema),
  speaker: publicSpeakerSchema.nullable(),
});

export type PublicContentSummary = z.infer<typeof publicContentSummarySchema>;

export const publicContentLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  order: z.number().int(),
});

export type PublicContentLink = z.infer<typeof publicContentLinkSchema>;

export const publicContentDetailSchema = publicContentSummarySchema.extend({
  body: z.string().nullable(),
  links: z.array(publicContentLinkSchema),
});

export type PublicContentDetail = z.infer<typeof publicContentDetailSchema>;

export const publicContentListSchema = z.object({
  items: z.array(publicContentSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export type PublicContentList = z.infer<typeof publicContentListSchema>;

export const publicContentQuerySchema = paginationQuerySchema.extend({
  type: z.enum(CONTENT_TYPES).optional(),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  speaker: z.string().trim().min(1).optional(),
});

export type PublicContentQuery = z.infer<typeof publicContentQuerySchema>;

/** Pencarian teks pada judul, ringkasan, dan isi konten terbit. */
export const publicSearchQuerySchema = paginationQuerySchema.extend({
  q: z
    .string()
    .trim()
    .min(2, 'Kata kunci minimal 2 karakter.')
    .max(100, 'Kata kunci terlalu panjang.'),
  type: z.enum(CONTENT_TYPES).optional(),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  speaker: z.string().trim().min(1).optional(),
});

export type PublicSearchQuery = z.infer<typeof publicSearchQuerySchema>;

export const publicLatestQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
});

/** Daftar konten terbaru lintas jenis untuk beranda. */
export const publicLatestSchema = z.object({
  items: z.array(publicContentSummarySchema),
});

export type PublicLatest = z.infer<typeof publicLatestSchema>;

/** Satu konten terbaru per jenis untuk beranda; null bila belum ada terbitan. */
export const publicHighlightsSchema = z.object({
  ARTICLE: publicContentSummarySchema.nullable(),
  AUDIO: publicContentSummarySchema.nullable(),
  VIDEO: publicContentSummarySchema.nullable(),
  LINK: publicContentSummarySchema.nullable(),
});

export type PublicHighlights = z.infer<typeof publicHighlightsSchema>;
