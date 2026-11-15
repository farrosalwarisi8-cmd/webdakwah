'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

function readId(formData: FormData): string {
  const id = formData.get('id');

  return typeof id === 'string' ? id : '';
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
}

function failureRedirect(id: string, error: unknown): never {
  redirect(
    `/dashboard/moderasi/${encodeURIComponent(id)}?error=${encodeURIComponent(errorMessage(error))}`,
  );
}

function refreshModeration(): void {
  revalidatePath('/dashboard/moderasi');
  revalidatePath('/dashboard/konten');
}

export async function publishContentAction(formData: FormData): Promise<void> {
  const id = readId(formData);

  if (!id) {
    redirect('/dashboard/moderasi');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}/publish`, { method: 'POST' });
  } catch (error) {
    failureRedirect(id, error);
  }

  refreshModeration();
  redirect('/dashboard/moderasi?sukses=diterbitkan');
}

export async function rejectContentAction(formData: FormData): Promise<void> {
  const id = readId(formData);
  const rawNote = formData.get('reviewNote');
  const reviewNote = typeof rawNote === 'string' ? rawNote : '';

  if (!id) {
    redirect('/dashboard/moderasi');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: { reviewNote },
    });
  } catch (error) {
    failureRedirect(id, error);
  }

  refreshModeration();
  redirect('/dashboard/moderasi?sukses=ditolak');
}
