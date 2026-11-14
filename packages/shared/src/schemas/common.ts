import { z } from 'zod';

import { CONTENT_LINK_TYPES, CONTENT_STATUSES, CONTENT_TYPES } from '../constants/content.js';
import { ROLES } from '../constants/roles.js';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export const roleSchema = z.enum(ROLES);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const contentTypeSchema = z.enum(CONTENT_TYPES);
export const contentLinkTypeSchema = z.enum(CONTENT_LINK_TYPES);

/**
 * Hanya izinkan http/https. Skema seperti `javascript:`, `data:`, atau `file:`
 * ditolak supaya tidak bisa dipakai untuk XSS.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const httpUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL wajib diisi')
  .max(2048, 'URL terlalu panjang')
  .refine(isSafeHttpUrl, 'URL harus diawali http:// atau https://');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
