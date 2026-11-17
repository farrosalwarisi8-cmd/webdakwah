import {
  DAY_OF_WEEK_LABELS,
  PLAY_MODE_LABELS,
  adminBroadcastScheduleListSchema,
  adminLiveStreamSchema,
  type AdminBroadcastSchedule,
  type AdminLiveStream,
} from '@webdakwah/shared';
import type { Metadata } from 'next';

import { ConfirmButton } from '@/components/confirm-button';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import {
  createScheduleAction,
  deleteScheduleAction,
  saveSettingsAction,
  toggleScheduleAction,
  updateScheduleAction,
} from './actions';

export const metadata: Metadata = {
  title: 'Siaran langsung',
  robots: { index: false, follow: false },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  pengaturan: 'Pengaturan siaran tersimpan.',
  'jadwal-baru': 'Jadwal siaran ditambahkan.',
  'jadwal-diubah': 'Jadwal siaran diperbarui.',
  'jadwal-aktif': 'Jadwal siaran diaktifkan.',
  'jadwal-nonaktif': 'Jadwal siaran dinonaktifkan.',
  'jadwal-dihapus': 'Jadwal siaran dihapus.',
};

const inputClass = 'mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm';
const labelClass = 'block text-sm';

const specialDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function scopeLabel(schedule: AdminBroadcastSchedule): string {
  if (schedule.date) {
    return specialDateFormatter.format(new Date(`${schedule.date}T00:00:00Z`));
  }

  return schedule.dayOfWeek === null
    ? 'Tanpa jadwal'
    : (DAY_OF_WEEK_LABELS[schedule.dayOfWeek] ?? 'Tanpa jadwal');
}

function ScheduleFields({
  speakers,
  schedule,
}: {
  speakers: { id: string; name: string }[];
  schedule?: AdminBroadcastSchedule;
}) {
  return (
    <>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Judul acara</span>
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={schedule?.title ?? ''}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Penceramah (opsional)</span>
        <select name="speakerId" defaultValue={schedule?.speakerId ?? ''} className={inputClass}>
          <option value="">— Tanpa penceramah —</option>
          {speakers.map((speaker) => (
            <option key={speaker.id} value={speaker.id}>
              {speaker.name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Hari mingguan</span>
        <select
          name="dayOfWeek"
          defaultValue={
            schedule?.dayOfWeek === null || schedule?.dayOfWeek === undefined
              ? ''
              : String(schedule.dayOfWeek)
          }
          className={inputClass}
        >
          <option value="">— Pakai tanggal khusus —</option>
          {DAY_OF_WEEK_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Atau tanggal khusus</span>
        <input name="date" type="date" defaultValue={schedule?.date ?? ''} className={inputClass} />
        <span className="mt-1 block text-xs text-ink-500">
          Isi salah satu: hari mingguan atau tanggal khusus, tidak keduanya.
        </span>
      </label>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Jam mulai (WIB)</span>
        <input
          name="startTime"
          type="time"
          required
          defaultValue={schedule?.startTime ?? ''}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="font-medium text-ink-800">Durasi (menit)</span>
        <input
          name="durationMin"
          type="number"
          min={5}
          max={720}
          defaultValue={schedule?.durationMin ?? 60}
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        <span className="font-medium text-ink-800">Catatan (opsional)</span>
        <textarea
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={schedule?.notes ?? ''}
          className={inputClass}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-ink-800">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={schedule?.isActive ?? true}
          className="size-4 rounded border-ink-300"
        />
        Tampilkan di halaman publik
      </label>
    </>
  );
}

export default async function SiaranDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string | string[]; error?: string | string[] }>;
}) {
  const viewer = await requireViewer('/dashboard/siaran');
  const params = await searchParams;
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  const sukses = firstValue(params.sukses);
  const errorParam = firstValue(params.error);

  let settings: AdminLiveStream | null = null;
  let schedules: AdminBroadcastSchedule[] = [];
  let speakers: { id: string; name: string }[] = [];
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      const [settingsRaw, schedulesRaw, speakersRaw] = await Promise.all([
        apiFetch('/broadcast/settings'),
        apiFetch('/broadcast/schedules'),
        apiFetch('/speakers/options'),
      ]);

      settings = adminLiveStreamSchema.parse(settingsRaw);
      schedules = adminBroadcastScheduleListSchema.parse(schedulesRaw);
      speakers = speakersRaw as { id: string; name: string }[];
    } catch (error) {
      loadError =
        error instanceof ApiError ? error.message : 'Gagal memuat data siaran. Coba lagi.';
    }
  }

  return (
    <main className="py-2 sm:py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Siaran langsung</h1>
        <p className="mt-1 text-sm text-ink-600">
          Atur alamat dengar radio mitra dan jadwal siaran. Jangan menyimpan kredensial panel radio
          di sini.
        </p>
      </div>

      {sukses && SUCCESS_MESSAGES[sukses] ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {SUCCESS_MESSAGES[sukses]}
        </p>
      ) : null}

      {errorParam ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorParam}
        </p>
      ) : null}

      {viewer.status === 'unconfigured' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Supabase belum dikonfigurasi.
        </div>
      ) : !profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Profil Anda belum terbaca dari API.
        </div>
      ) : !isAdmin ? (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
          Halaman ini khusus admin.
        </div>
      ) : (
        <>
          {loadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
              {loadError}
            </div>
          ) : null}

          {settings ? (
            <section className="mt-6 rounded-3xl border border-ink-200 bg-white p-6">
              <h2 className="text-base font-semibold text-ink-900">Pengaturan siaran</h2>
              <p className="mt-1 text-sm text-ink-500">
                Alamat dengar publik dari pengelola radio. Website hanya memakai URL ini, bukan
                kredensial siaran.
              </p>

              <form action={saveSettingsAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className="font-medium text-ink-800">Judul siaran</span>
                  <input
                    name="title"
                    required
                    maxLength={120}
                    defaultValue={settings.title}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className="font-medium text-ink-800">Mode pemutaran</span>
                  <select name="playMode" defaultValue={settings.playMode} className={inputClass}>
                    <option value="EMBED">{PLAY_MODE_LABELS.EMBED}</option>
                    <option value="EXTERNAL">{PLAY_MODE_LABELS.EXTERNAL}</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className="font-medium text-ink-800">Deskripsi</span>
                  <textarea
                    name="description"
                    rows={2}
                    maxLength={500}
                    defaultValue={settings.description ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className="font-medium text-ink-800">Alamat dengar publik</span>
                  <input
                    name="streamUrl"
                    type="url"
                    placeholder="https://radio.contoh.com/stream"
                    defaultValue={settings.streamUrl ?? ''}
                    className={inputClass}
                  />
                </label>
                <div className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 sm:col-span-2">
                  Peringatan: alamat <code>http://</code> selalu dibuka di tab baru. Browser
                  memblokir audio <code>http</code> di halaman <code>https</code> (mixed content),
                  sehingga pemutar di halaman hanya aktif untuk alamat <code>https://</code>.
                </div>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className="font-medium text-ink-800">URL status siaran (opsional)</span>
                  <input
                    name="statusUrl"
                    type="url"
                    placeholder="https://radio.contoh.com/status.json"
                    defaultValue={settings.statusUrl ?? ''}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs text-ink-500">
                    Hanya https. Kembalikan JSON <code>{'{"live": true}'}</code> atau teks{' '}
                    <code>live</code>/<code>offline</code>. Diperiksa paling sering tiap 30 detik
                    dengan batas 3 detik.
                  </span>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className="font-medium text-ink-800">URL Telegram (opsional)</span>
                  <input
                    name="telegramUrl"
                    type="url"
                    placeholder="https://t.me/kanalradio"
                    defaultValue={settings.telegramUrl ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    defaultChecked={settings.isEnabled}
                    className="size-4 rounded border-ink-300"
                  />
                  Aktifkan siaran
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Simpan pengaturan
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="mt-6 rounded-3xl border border-ink-200 bg-white p-6">
            <h2 className="text-base font-semibold text-ink-900">Jadwal siaran</h2>
            <p className="mt-1 text-sm text-ink-500">
              Semua jam dalam WIB (Asia/Jakarta). Jadwal nonaktif tidak tampil di halaman publik.
            </p>

            <details className="mt-4 rounded-2xl border border-ink-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                Tambah jadwal baru
              </summary>
              <form action={createScheduleAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                <ScheduleFields speakers={speakers} />
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Tambah jadwal
                  </button>
                </div>
              </form>
            </details>

            {schedules.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-surface-soft p-4 text-sm text-ink-500">
                Belum ada jadwal. Tambahkan jadwal mingguan atau acara khusus di atas.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {schedules.map((schedule) => (
                  <li key={schedule.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-ink-900">{schedule.title}</p>
                        <p className="mt-1 text-xs text-ink-500">
                          {scopeLabel(schedule)} · {schedule.startTime} WIB · {schedule.durationMin}{' '}
                          menit
                          {schedule.speakerName ? ` · ${schedule.speakerName}` : ''}
                        </p>
                        <p className="mt-1 text-xs font-medium">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              schedule.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-ink-100 text-ink-600'
                            }`}
                          >
                            {schedule.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </p>
                        {schedule.notes ? (
                          <p className="mt-2 text-xs leading-relaxed text-ink-500">
                            {schedule.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <form action={toggleScheduleAction}>
                          <input type="hidden" name="id" value={schedule.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={schedule.isActive ? 'false' : 'true'}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                          >
                            {schedule.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </form>
                        <form action={deleteScheduleAction}>
                          <input type="hidden" name="id" value={schedule.id} />
                          <ConfirmButton
                            message={`Hapus jadwal "${schedule.title}"? Tindakan ini tidak bisa dibatalkan.`}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                          >
                            Hapus
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-ink-600">
                        Ubah jadwal
                      </summary>
                      <form
                        action={updateScheduleAction}
                        className="mt-3 grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={schedule.id} />
                        <ScheduleFields speakers={speakers} schedule={schedule} />
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="inline-flex min-h-11 items-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
                          >
                            Simpan perubahan
                          </button>
                        </div>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
