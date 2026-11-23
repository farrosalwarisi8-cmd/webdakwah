'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

/** Mengubah nama tampilan pemilik akun. Role tidak bisa diubah dari sini. */
export async function updateNameAction(formData: FormData): Promise<void> {
  const fullName = readString(formData, 'fullName').trim();

  if (!fullName) {
    redirect('/akun?error=' + encodeURIComponent('Nama tidak boleh kosong.'));
  }

  try {
    await apiFetch('/me', { method: 'PATCH', body: { fullName } });
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
    redirect(`/akun?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/akun');
  redirect('/akun?sukses=nama');
}
