import { z } from 'zod';

import { CONTENT_TYPES } from '../constants/content.js';
import { paginationQuerySchema } from './common.js';

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
});

export type PublicContentSummary = z.infer<typeof publicContentSummarySchema>;

export const publicContentDetailSchema = publicContentSummarySchema.extend({
  body: z.string().nullable(),
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
});

export type PublicContentQuery = z.infer<typeof publicContentQuerySchema>;

/** Satu konten terbaru per jenis untuk beranda; null bila belum ada terbitan. */
export const publicHighlightsSchema = z.object({
  ARTICLE: publicContentSummarySchema.nullable(),
  AUDIO: publicContentSummarySchema.nullable(),
  VIDEO: publicContentSummarySchema.nullable(),
  LINK: publicContentSummarySchema.nullable(),
});

export type PublicHighlights = z.infer<typeof publicHighlightsSchema>;
