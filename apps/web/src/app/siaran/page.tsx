import {
  BROADCAST_TIMEZONE_LABEL,
  DAY_OF_WEEK_LABELS,
  type PublicBroadcastSchedule,
  type PublicLive,
} from '@webdakwah/shared';
import { ExternalLink, Radio, Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { LiveAudioPlayer } from '@/components/public/live-audio-player';
import { LiveWatchToggle } from '@/components/public/live-watch-toggle';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { PublicApiError, getPublicLive } from '@/lib/api/public';
import { describeBroadcastSchedule } from '@/lib/broadcast-schedule';

export const metadata: Metadata = {
  title: 'Siaran Langsung',
  description:
    'Dengarkan siaran langsung radio dakwah mitra, lihat jadwal kajian mingguan, dan simak acara khusus.',
  alternates: { canonical: '/siaran' },
  openGraph: {
    title: 'Siaran Langsung',
    description: 'Dengarkan siaran langsung radio dakwah mitra dan lihat jadwal kajiannya.',
    url: '/siaran',
  },
};

/** Revalidasi singkat: perubahan jadwal admin cepat terlihat tanpa membebani API. */
export const revalidate = 30;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const STATUS_COPY: Record<PublicLive['liveStatus'], { label: string; className: string }> = {
  LIVE: { label: 'Sedang mengudara', className: 'bg-emerald-50 text-emerald-800' },
  OFFLINE: { label: 'Sedang tidak mengudara', className: 'bg-ink-100 text-ink-700' },
  UNKNOWN: { label: 'Sesuai jadwal', className: 'bg-ink-100 text-ink-700' },
};

const specialDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatTime(startTime: string): string {
  return `${startTime} ${BROADCAST_TIMEZONE_LABEL}`;
}

function durationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60} jam`;
  }

  return `${minutes} menit`;
}

function ScheduleCard({ schedule }: { schedule: PublicBroadcastSchedule }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink-900">{schedule.title}</p>
      <p className="mt-1 text-xs text-ink-600">
        {formatTime(schedule.startTime)} · {durationLabel(schedule.durationMin)}
      </p>
      {schedule.speakerName ? (
        <p className="mt-1 text-xs text-ink-500">Pengisi: {schedule.speakerName}</p>
      ) : null}
      {schedule.notes ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">{schedule.notes}</p>
      ) : null}
    </div>
  );
}

export default async function SiaranPage() {
  let live: PublicLive | null = null;
  let loadError: string | null = null;

  try {
    live = await getPublicLive();
  } catch (caught) {
    loadError =
      caught instanceof PublicApiError
        ? caught.message
        : 'Informasi siaran belum bisa dimuat. Coba lagi beberapa saat.';
  }

  const weekly = live?.schedules.filter((schedule) => schedule.dayOfWeek !== null) ?? [];
  const special = live?.schedules.filter((schedule) => schedule.date !== null) ?? [];
  const status = STATUS_COPY[live?.liveStatus ?? 'UNKNOWN'];
  const canPlay = Boolean(live?.isEnabled && live.streamUrl);
  const isExternal = live?.playMode !== 'EMBED';
  const scheduleHint = describeBroadcastSchedule(new Date(), live?.schedules ?? []);

  return (
    <div className="min-h-dvh bg-ink-50">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Remah roti" className="text-xs text-ink-500">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">Siaran</span>
        </nav>

        <section className="mt-4 overflow-hidden rounded-3xl border border-ink-200 bg-white">
          <div className="bg-ink-900 px-6 py-8 text-white sm:px-10 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Radio aria-hidden className="size-3.5" />
              Radio mitra
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {live?.title ?? 'Siaran Langsung'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {live?.description ??
                'Dengarkan siaran dakwah langsung dari radio mitra kami. Jadwal memakai waktu Indonesia Barat (WIB).'}
            </p>

            <span
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
            >
              <span aria-hidden className="size-2 rounded-full bg-current" />
              {status.label}
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {loadError ? (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                {loadError} Halaman tetap dapat dibuka; silakan coba lagi nanti.
              </p>
            ) : null}

            {live && live.liveStatus === 'UNKNOWN' ? (
              <div className="rounded-2xl border border-ink-200 bg-surface-soft p-4">
                <p className="text-sm font-medium text-ink-800">Sesuai jadwal</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {scheduleHint.kind === 'NONE'
                    ? 'Belum ada jadwal aktif yang bisa ditampilkan. Silakan cek kembali nanti.'
                    : scheduleHint.label}
                </p>
              </div>
            ) : null}

            {canPlay && live?.streamUrl ? (
              isExternal ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-relaxed text-ink-600">
                    Siaran dibuka di website radio mitra. Tekan tombol untuk mendengarkan di tab
                    baru.
                  </p>
                  <a
                    href={live.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
                  >
                    Dengarkan di radio
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                </div>
              ) : (
                <LiveAudioPlayer src={live.streamUrl} title={live.title} />
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-surface-soft p-4">
                <p className="text-sm font-medium text-ink-800">
                  Siaran sedang tidak mengudara. Lihat jadwal di bawah.
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Jika sedang ada jadwal, tekan tombol putar saat siaran dimulai.
                </p>
              </div>
            )}

            {live?.telegramUrl ? (
              <a
                href={live.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
              >
                <Send aria-hidden className="size-4" />
                Dengarkan di Telegram
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            ) : null}

            {live?.isEnabled && live.streamUrl && live.channelId ? (
              <section
                aria-labelledby="ikuti-siaran"
                className="mt-4 rounded-2xl border border-ink-200 bg-surface-soft p-5"
              >
                <h2 id="ikuti-siaran" className="text-sm font-semibold text-ink-900">
                  Ikuti siaran ini
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  Tandai bahwa Anda mengikuti siaran ini. Jumlah pengikut tampil di halaman ini.
                </p>
                <div className="mt-3">
                  <LiveWatchToggle channelId={live.channelId} />
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="jadwal-siaran" className="mt-10">
          <h2 id="jadwal-siaran" className="text-xl font-semibold text-ink-900">
            Jadwal mingguan
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Semua jam dalam {BROADCAST_TIMEZONE_LABEL} (Asia/Jakarta).
          </p>

          {weekly.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
              Belum ada jadwal mingguan yang aktif.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAY_ORDER.map((day) => {
                const items = weekly.filter((schedule) => schedule.dayOfWeek === day);

                if (items.length === 0) return null;

                return (
                  <div key={day} className="rounded-3xl border border-ink-200 bg-surface-soft p-4">
                    <h3 className="text-sm font-semibold text-ink-900">
                      {DAY_OF_WEEK_LABELS[day]}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {items.map((schedule) => (
                        <ScheduleCard
                          key={`${day}-${schedule.startTime}-${schedule.title}`}
                          schedule={schedule}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {special.length > 0 ? (
          <section aria-labelledby="acara-khusus" className="mt-10">
            <h2 id="acara-khusus" className="text-xl font-semibold text-ink-900">
              Acara khusus
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {special.map((schedule) => (
                <li key={`${schedule.date}-${schedule.startTime}-${schedule.title}`}>
                  <div className="rounded-2xl border border-ink-200 bg-white p-4">
                    <p className="text-xs font-medium text-brand-700">
                      {schedule.date
                        ? specialDateFormatter.format(new Date(`${schedule.date}T00:00:00Z`))
                        : ''}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">{schedule.title}</p>
                    <p className="mt-1 text-xs text-ink-600">
                      {formatTime(schedule.startTime)} · {durationLabel(schedule.durationMin)}
                    </p>
                    {schedule.speakerName ? (
                      <p className="mt-1 text-xs text-ink-500">Pengisi: {schedule.speakerName}</p>
                    ) : null}
                    {schedule.notes ? (
                      <p className="mt-2 text-xs leading-relaxed text-ink-500">{schedule.notes}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
