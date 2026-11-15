'use server';

import { uploadRequestSchema } from '@webdakwah/shared';

import { ApiError, apiFetch } from '@/lib/api/server';

export type PresignActionResult =
  { ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string };

/**
 * Server Action menjaga token sesi tetap di cookie; browser hanya menerima
 * URL PUT sementara, bukan kredensial R2.
 */
export async function requestUploadAction(input: {
  contentType: string;
  size: number;
}): Promise<PresignActionResult> {
  const parsed = uploadRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join(' ') };
  }

  try {
    const result = await apiFetch<{ uploadUrl: string; publicUrl: string }>('/uploads/presign', {
      method: 'POST',
      body: parsed.data,
    });

    return { ok: true, uploadUrl: result.uploadUrl, publicUrl: result.publicUrl };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: 'Tidak bisa menyiapkan unggahan. Coba lagi beberapa saat.' };
  }
}
