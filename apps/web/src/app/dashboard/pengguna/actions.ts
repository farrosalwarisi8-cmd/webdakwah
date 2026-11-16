'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function failureRedirect(error: unknown): never {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
  redirect(`/dashboard/pengguna?error=${encodeURIComponent(message)}`);
}

function refresh(): void {
  revalidatePath('/dashboard/pengguna');
}

export async function createUserAction(formData: FormData): Promise<void> {
  const email = readString(formData, 'email').trim();
  const password = readString(formData, 'password');
  const fullName = readString(formData, 'fullName').trim();
  const role = readString(formData, 'role') || 'CONTRIBUTOR';

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/pengguna?sukses=ditambahkan');
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect('/dashboard/pengguna');

  const fullName = readString(formData, 'fullName').trim();
  const role = readString(formData, 'role');
  const isActive = readString(formData, 'isActive');

  const body: Record<string, unknown> = {};
  if (fullName !== '') body.fullName = fullName;
  if (role) body.role = role;
  if (isActive === 'true' || isActive === 'false') body.isActive = isActive === 'true';

  try {
    await apiFetch(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/pengguna?sukses=diperbarui');
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  const password = readString(formData, 'password');
  if (!id) redirect('/dashboard/pengguna');

  try {
    await apiFetch(`/users/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/pengguna?sukses=katasandi');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  if (!id) redirect('/dashboard/pengguna');

  try {
    await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/pengguna?sukses=dihapus');
}
