'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

function readId(formData: FormData): string {
  const id = formData.get('id');

  return typeof id === 'string' ? id : '';
}

function failureRedirect(error: unknown): never {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';

  redirect(`/dashboard/terbitan?error=${encodeURIComponent(message)}`);
}

function refresh(): void {
  revalidatePath('/dashboard/terbitan');
  revalidatePath('/dashboard/konten');
}

export async function archiveContentAction(formData: FormData): Promise<void> {
  const id = readId(formData);

  if (!id) {
    redirect('/dashboard/terbitan');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}/archive`, { method: 'POST' });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/terbitan?status=ARCHIVED&sukses=diarsipkan');
}

export async function unarchiveContentAction(formData: FormData): Promise<void> {
  const id = readId(formData);

  if (!id) {
    redirect('/dashboard/terbitan');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}/unarchive`, { method: 'POST' });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/terbitan?status=PUBLISHED&sukses=dipulihkan');
}
