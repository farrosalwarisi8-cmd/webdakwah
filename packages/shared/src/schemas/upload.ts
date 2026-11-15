import { z } from 'zod';

/** Jenis berkas media yang boleh diunggah langsung ke R2. */
export const UPLOAD_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'video/mp4',
  'video/webm',
] as const;

export type UploadMimeType = (typeof UPLOAD_MIME_TYPES)[number];

const MEGABYTE = 1024 * 1024;

/** Batas ukuran per jenis; video lebih besar karena berdurasi panjang. */
export const UPLOAD_MAX_BYTES: Record<UploadMimeType, number> = {
  'audio/mpeg': 50 * MEGABYTE,
  'audio/mp4': 50 * MEGABYTE,
  'audio/aac': 50 * MEGABYTE,
  'audio/ogg': 50 * MEGABYTE,
  'video/mp4': 200 * MEGABYTE,
  'video/webm': 200 * MEGABYTE,
};

export function uploadMaxMegabytes(contentType: UploadMimeType): number {
  return Math.round(UPLOAD_MAX_BYTES[contentType] / MEGABYTE);
}

/**
 * Permintaan URL unggah. Server memeriksa ulang jenis dan ukuran karena
 * validasi di browser bisa dilewati.
 */
export const uploadRequestSchema = z
  .object({
    contentType: z.enum(UPLOAD_MIME_TYPES),
    size: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    const max = UPLOAD_MAX_BYTES[value.contentType];

    if (value.size > max) {
      context.addIssue({
        code: 'custom',
        path: ['size'],
        message: `Ukuran berkas maksimal ${uploadMaxMegabytes(value.contentType)} MB.`,
      });
    }
  });

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
