'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from '@/lib/api/server';

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.';
}

function refreshDashboard(): void {
  revalidatePath('/dashboard/notifikasi');
  revalidatePath('/dashboard', 'layout');
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const id = formData.get('id');

  if (typeof id !== 'string' || !id) {
    redirect('/dashboard/notifikasi');
  }

  try {
    await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  } catch (error) {
    redirect(`/dashboard/notifikasi?error=${encodeURIComponent(errorMessage(error))}`);
  }

  refreshDashboard();
}

export async function markAllNotificationsReadAction(): Promise<void> {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
  } catch (error) {
    redirect(`/dashboard/notifikasi?error=${encodeURIComponent(errorMessage(error))}`);
  }

  refreshDashboard();
}
