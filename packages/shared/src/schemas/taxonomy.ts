import { z } from 'zod';

import {
  CATEGORY_NAME_MAX_LENGTH,
  MAX_CATEGORIES_PER_CONTENT,
  MAX_TAGS_PER_CONTENT,
  SPEAKER_BIO_MAX_LENGTH,
  SPEAKER_NAME_MAX_LENGTH,
  TAG_NAME_MAX_LENGTH,
  TAG_NAME_MIN_LENGTH,
} from '../constants/taxonomy.js';
import { isSafeHttpUrl, paginationQuerySchema } from './common.js';

/** Normalisasi nama tag sebelum validasi dan penyimpanan. */
export const tagNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(TAG_NAME_MIN_LENGTH, `Tag minimal ${TAG_NAME_MIN_LENGTH} karakter`)
      .max(TAG_NAME_MAX_LENGTH, `Tag maksimal ${TAG_NAME_MAX_LENGTH} karakter`),
  );

export const tagNamesSchema = z
  .array(tagNameSchema)
  .max(MAX_TAGS_PER_CONTENT, `Maksimal ${MAX_TAGS_PER_CONTENT} tag per konten`)
  .transform((names) => Array.from(new Set(names)));

export const categoryIdsSchema = z
  .array(z.uuid('ID kategori tidak valid'))
  .max(MAX_CATEGORIES_PER_CONTENT, `Maksimal ${MAX_CATEGORIES_PER_CONTENT} kategori per konten`);

export const speakerIdSchema = z.uuid('ID penceramah tidak valid').nullable().optional();

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(CATEGORY_NAME_MAX_LENGTH, `Nama kategori maksimal ${CATEGORY_NAME_MAX_LENGTH} karakter`),
});

export const speakerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama penceramah minimal 2 karakter')
    .max(SPEAKER_NAME_MAX_LENGTH, `Nama penceramah maksimal ${SPEAKER_NAME_MAX_LENGTH} karakter`),
  bio: z.string().trim().max(SPEAKER_BIO_MAX_LENGTH).optional().default(''),
  avatarUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => value === '' || isSafeHttpUrl(value), 'URL avatar harus http/https')
    .optional()
    .default(''),
});

export const tagRenameSchema = z.object({
  name: tagNameSchema,
});

export const tagMergeSchema = z.object({
  targetId: z.uuid('ID tag tujuan tidak valid'),
});

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const speakerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Bentuk taksonomi yang aman untuk publik (tanpa id/status/data internal). */
/** Item taksonomi untuk halaman admin: jumlah konten terbit dan total relasi. */
const taxonomyCountSchema = {
  publishedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
};

export const categoryManageSchema = categorySchema.extend(taxonomyCountSchema);
export const tagManageSchema = tagSchema.extend(taxonomyCountSchema);
export const speakerManageSchema = speakerSchema.extend(taxonomyCountSchema);

export const taxonomyDeleteResultSchema = z.object({
  ok: z.literal(true),
  affectedContents: z.number().int().nonnegative(),
});

export const tagCleanupResultSchema = z.object({
  deleted: z.number().int().nonnegative(),
});

export const publicCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const publicTagSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const publicSpeakerSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const publicCategoryListSchema = z.array(publicCategorySchema);
export const publicTagListSchema = z.array(publicTagSchema);
export const publicSpeakerListSchema = z.array(publicSpeakerSchema);

export const categoryListQuerySchema = paginationQuerySchema;
export const tagListQuerySchema = paginationQuerySchema;
export const speakerListQuerySchema = paginationQuerySchema;

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type SpeakerInput = z.infer<typeof speakerInputSchema>;
export type TagRenameInput = z.infer<typeof tagRenameSchema>;
export type TagMergeInput = z.infer<typeof tagMergeSchema>;
export type CategoryManage = z.infer<typeof categoryManageSchema>;
export type TagManage = z.infer<typeof tagManageSchema>;
export type SpeakerManage = z.infer<typeof speakerManageSchema>;
export type TaxonomyDeleteResult = z.infer<typeof taxonomyDeleteResultSchema>;
export type TagCleanupResult = z.infer<typeof tagCleanupResultSchema>;
