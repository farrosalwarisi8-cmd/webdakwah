'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

const BASE_PATH = '/dashboard/taksonomi';

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function failureRedirect(error: unknown): never {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
  redirect(`${BASE_PATH}?error=${encodeURIComponent(message)}`);
}

function done(key: string): never {
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}?sukses=${key}`);
}

// ---------- Kategori ----------

export async function createCategoryAction(formData: FormData): Promise<void> {
  try {
    await apiFetch('/categories', {
      method: 'POST',
      body: { name: readString(formData, 'name').trim() },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('kategori-ditambah');
}

export async function renameCategoryAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { name: readString(formData, 'name').trim() },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('kategori-diubah');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(error);
  }

  done('kategori-dihapus');
}

// ---------- Penceramah ----------

export async function createSpeakerAction(formData: FormData): Promise<void> {
  try {
    await apiFetch('/speakers', {
      method: 'POST',
      body: {
        name: readString(formData, 'name').trim(),
        bio: readString(formData, 'bio').trim(),
        avatarUrl: readString(formData, 'avatarUrl').trim(),
      },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('penceramah-ditambah');
}

export async function updateSpeakerAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/speakers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: {
        name: readString(formData, 'name').trim(),
        bio: readString(formData, 'bio'),
        avatarUrl: readString(formData, 'avatarUrl').trim(),
      },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('penceramah-diubah');
}

export async function deleteSpeakerAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/speakers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(error);
  }

  done('penceramah-dihapus');
}

// ---------- Tag ----------

export async function renameTagAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/tags/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { name: readString(formData, 'name') },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('tag-diubah');
}

export async function mergeTagAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  const targetId = readString(formData, 'targetId');
  if (!id || !targetId) redirect(BASE_PATH);

  try {
    await apiFetch(`/tags/${encodeURIComponent(id)}/merge`, {
      method: 'POST',
      body: { targetId },
    });
  } catch (error) {
    failureRedirect(error);
  }

  done('tag-digabung');
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect(BASE_PATH);

  try {
    await apiFetch(`/tags/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(error);
  }

  done('tag-dihapus');
}

export async function cleanupOrphanTagsAction(): Promise<void> {
  try {
    await apiFetch('/tags/cleanup-orphans', { method: 'POST' });
  } catch (error) {
    failureRedirect(error);
  }

  done('tag-yatim');
}
