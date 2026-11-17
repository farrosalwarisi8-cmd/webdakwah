'use server';

import type { AdminBroadcastSchedule } from '@webdakwah/shared';
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
  redirect(`/dashboard/siaran?error=${encodeURIComponent(message)}`);
}

function refresh(): void {
  revalidatePath('/dashboard/siaran');
  revalidatePath('/siaran');
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const payload = {
    title: readString(formData, 'title').trim(),
    description: readString(formData, 'description').trim(),
    streamUrl: readString(formData, 'streamUrl').trim(),
    playMode: readString(formData, 'playMode') || 'EXTERNAL',
    statusUrl: readString(formData, 'statusUrl').trim(),
    telegramUrl: readString(formData, 'telegramUrl').trim(),
    isEnabled: formData.get('isEnabled') === 'on',
  };

  try {
    await apiFetch('/broadcast/settings', { method: 'PATCH', body: payload });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/siaran?sukses=pengaturan');
}

function schedulePayload(formData: FormData) {
  const date = readString(formData, 'date').trim();
  const dayValue = readString(formData, 'dayOfWeek');
  const speakerId = readString(formData, 'speakerId').trim();

  return {
    title: readString(formData, 'title').trim(),
    speakerId: speakerId || null,
    dayOfWeek: date || dayValue === '' ? null : Number(dayValue),
    date: date || null,
    startTime: readString(formData, 'startTime').trim(),
    durationMin: Number(readString(formData, 'durationMin')) || 60,
    notes: readString(formData, 'notes').trim(),
    isActive: formData.get('isActive') === 'on',
  };
}

export async function createScheduleAction(formData: FormData): Promise<void> {
  try {
    await apiFetch('/broadcast/schedules', { method: 'POST', body: schedulePayload(formData) });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/siaran?sukses=jadwal-baru');
}

export async function updateScheduleAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');

  if (!id) redirect('/dashboard/siaran');

  try {
    await apiFetch(`/broadcast/schedules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: schedulePayload(formData),
    });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/siaran?sukses=jadwal-diubah');
}

/** Mengambil jadwal dari API agar nonaktifkan tidak menimpa field lain. */
export async function toggleScheduleAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');
  const nextActive = readString(formData, 'isActive') === 'true';

  if (!id) redirect('/dashboard/siaran');

  try {
    const schedules = await apiFetch<AdminBroadcastSchedule[]>('/broadcast/schedules');
    const schedule = schedules.find((item) => item.id === id);

    if (!schedule) {
      redirect('/dashboard/siaran?error=Jadwal%20tidak%20ditemukan.');
    }

    await apiFetch(`/broadcast/schedules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: {
        title: schedule.title,
        speakerId: schedule.speakerId,
        dayOfWeek: schedule.dayOfWeek,
        date: schedule.date,
        startTime: schedule.startTime,
        durationMin: schedule.durationMin,
        notes: schedule.notes ?? '',
        isActive: nextActive,
      },
    });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect(`/dashboard/siaran?sukses=${nextActive ? 'jadwal-aktif' : 'jadwal-nonaktif'}`);
}

export async function deleteScheduleAction(formData: FormData): Promise<void> {
  const id = readString(formData, 'id');

  if (!id) redirect('/dashboard/siaran');

  try {
    await apiFetch(`/broadcast/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    failureRedirect(error);
  }

  refresh();
  redirect('/dashboard/siaran?sukses=jadwal-dihapus');
}
