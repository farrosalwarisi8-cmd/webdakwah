'use server';

import { contentInputSchema } from '@webdakwah/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

import type { ContentFormState } from './form-state';

function readFormData(formData: FormData) {
  const get = (name: string): string => {
    const value = formData.get(name);

    return typeof value === 'string' ? value : '';
  };

  return {
    type: get('type'),
    title: get('title'),
    excerpt: get('excerpt'),
    body: get('body'),
    mediaUrl: get('mediaUrl'),
    categoryIds: formData.getAll('categoryIds').filter((value): value is string => typeof value === 'string'),
    tagNames: get('tagNames')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    speakerId: get('speakerId') || null,
    links: formData
      .getAll('linkTitle')
      .map((title, index) => ({
        title: typeof title === 'string' ? title : '',
        url: (() => {
          const value = formData.getAll('linkUrl')[index];
          return typeof value === 'string' ? value : '';
        })(),
      }))
      .filter((link) => link.title.trim() !== '' || link.url.trim() !== ''),
  };
}

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
    `/dashboard/konten/${encodeURIComponent(id)}?error=${encodeURIComponent(errorMessage(error))}`,
  );
}

export async function createContentAction(
  _previous: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const parsed = contentInputSchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(' ') };
  }

  let id: string;

  try {
    const content = await apiFetch<{ id: string }>('/contents', {
      method: 'POST',
      body: parsed.data,
    });

    id = content.id;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath('/dashboard/konten');
  redirect(`/dashboard/konten/${id}?sukses=tersimpan`);
}

export async function updateContentAction(
  _previous: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const id = readId(formData);

  if (!id) {
    return { error: 'Konten tidak ditemukan.' };
  }

  const parsed = contentInputSchema.safeParse(readFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(' ') };
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath('/dashboard/konten');
  revalidatePath(`/dashboard/konten/${id}`);
  redirect(`/dashboard/konten/${id}?sukses=tersimpan`);
}

async function transition(
  formData: FormData,
  action: 'submit' | 'withdraw',
  success: string,
): Promise<never> {
  const id = readId(formData);

  if (!id) {
    redirect('/dashboard/konten');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
  } catch (error) {
    failureRedirect(id, error);
  }

  revalidatePath('/dashboard/konten');
  revalidatePath(`/dashboard/konten/${id}`);
  redirect(`/dashboard/konten/${id}?sukses=${success}`);
}

export async function submitContentAction(formData: FormData): Promise<void> {
  await transition(formData, 'submit', 'diajukan');
}

export async function withdrawContentAction(formData: FormData): Promise<void> {
  await transition(formData, 'withdraw', 'ditarik');
}

export async function deleteContentAction(formData: FormData): Promise<void> {
  const id = readId(formData);

  if (!id) {
    redirect('/dashboard/konten');
  }

  try {
    await apiFetch(`/contents/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(id, error);
  }

  revalidatePath('/dashboard/konten');
  redirect('/dashboard/konten?dihapus=1');
}
