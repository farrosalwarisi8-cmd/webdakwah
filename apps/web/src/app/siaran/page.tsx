import {
  BROADCAST_TIMEZONE_LABEL,
  DAY_OF_WEEK_LABELS,
  type PublicBroadcastSchedule,
  type PublicLive,
} from '@webdakwah/shared';
import { CalendarDays, Clock3, ExternalLink, Radio, Send, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { LiveAudioPlayer } from '@/components/public/live-audio-player';
import { LiveWatchToggle } from '@/components/public/live-watch-toggle';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { PublicApiError, getPublicLive } from '@/lib/api/public';
import { describeBroadcastSchedule, toWibDate } from '@/lib/broadcast-schedule';

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

const STATUS_COPY: Record<PublicLive['liveStatus'], { label: string; dot: string; chip: string }> =
  {
    LIVE: {
      label: 'Sedang mengudara',
      dot: 'bg-emerald-400',
      chip: 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/30',
    },
    OFFLINE: {
      label: 'Sedang tidak mengudara',
      dot: 'bg-white/50',
      chip: 'bg-white/10 text-white/80 ring-1 ring-white/15',
    },
    UNKNOWN: {
      label: 'Sesuai jadwal',
      dot: 'bg-accent-400',
      chip: 'bg-white/10 text-white/85 ring-1 ring-white/15',
    },
  };

const specialDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const specialDayFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: 'UTC' });
const specialMonthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' });

function formatTime(startTime: string): string {
  return `${startTime} ${BROADCAST_TIMEZONE_LABEL}`;
}

function durationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60} jam`;
  }

  return `${minutes} menit`;
}

/** Label hari relatif terhadap hari ini dalam WIB. */
function relativeDay(start: Date, now: Date): string {
  const from = toWibDate(start);
  const today = toWibDate(now);
  const diff = Math.round(
    (Date.UTC(from.year, from.month - 1, from.day) -
      Date.UTC(today.year, today.month - 1, today.day)) /
      86_400_000,
  );

  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  if (diff > 1 && diff < 7) return `${diff} hari lagi`;

  return DAY_OF_WEEK_LABELS[from.weekday] ?? '';
}

function ScheduleCard({
  schedule,
  emphasis = false,
}: {
  schedule: PublicBroadcastSchedule;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`card-lift rounded-2xl border p-4 ${
        emphasis
          ? 'border-accent-200 bg-white shadow-soft'
          : 'border-ink-200 bg-white hover:border-brand-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink-900">{schedule.title}</p>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
          {schedule.startTime}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
        <Clock3 aria-hidden className="size-3.5 text-ink-400" />
        {formatTime(schedule.startTime)} · {durationLabel(schedule.durationMin)}
      </p>
      {schedule.speakerName ? (
        <p className="mt-1 text-xs text-ink-500">Pengisi: {schedule.speakerName}</p>
      ) : null}
      {schedule.notes ? (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">{schedule.notes}</p>
      ) : null}
    </article>
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

  const now = new Date();
  const weekly = live?.schedules.filter((schedule) => schedule.dayOfWeek !== null) ?? [];
  const special = live?.schedules.filter((schedule) => schedule.date !== null) ?? [];
  const status = STATUS_COPY[live?.liveStatus ?? 'UNKNOWN'];
  const canPlay = Boolean(live?.isEnabled && live.streamUrl);
  const isExternal = live?.playMode !== 'EMBED';
  const scheduleHint = describeBroadcastSchedule(now, live?.schedules ?? []);
  const todayWeekday = toWibDate(now).weekday;
  const isLive = live?.liveStatus === 'LIVE';

  return (
    <div className="min-h-dvh bg-ink-50">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <nav aria-label="Remah roti" className="py-4 text-xs text-ink-500">
          <Link href="/" className="transition hover:text-brand-700">
            Beranda
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-700">Siaran</span>
        </nav>

        {/* Hero: panel gelap dengan pola geometris dan sorotan oranye. */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white shadow-panel sm:rounded-[32px]">
          <div aria-hidden className="pattern-islamic absolute inset-0 opacity-45" />
          <div
            aria-hidden
            className="absolute -top-24 -right-16 size-64 rounded-full border border-white/10 sm:size-80"
          />
          <div
            aria-hidden
            className="absolute -top-10 -right-2 size-36 rounded-full border border-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-20 size-56 rounded-full bg-accent-500/15 blur-3xl"
          />

          <div className="relative px-5 pt-7 pb-16 sm:px-8 sm:pt-9 sm:pb-20 lg:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/85 ring-1 ring-white/15">
              <Radio aria-hidden className="size-3.5" />
              Radio mitra
            </span>

            <h1 className="mt-4 font-display text-[1.9rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {live?.title ?? 'Siaran Langsung'}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              {live?.description ??
                'Dengarkan siaran dakwah langsung dari radio mitra kami. Jadwal memakai waktu Indonesia Barat (WIB).'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.chip}`}
              >
                <span className="relative flex size-2">
                  {isLive ? (
                    <span
                      aria-hidden
                      className={`absolute inline-flex size-2 animate-ping rounded-full opacity-75 ${status.dot}`}
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={`relative inline-flex size-2 rounded-full ${status.dot}`}
                  />
                </span>
                {status.label}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/10">
                <Clock3 aria-hidden className="size-3.5" />
                {BROADCAST_TIMEZONE_LABEL}
              </span>

              {weekly.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/10">
                  <CalendarDays aria-hidden className="size-3.5" />
                  {weekly.length} jadwal mingguan
                </span>
              ) : null}
            </div>
          </div>
        </section>

        {/* Kartu pemutar naik menimpa hero agar jadi pusat perhatian. */}
        <section
          aria-labelledby="mendengarkan"
          className="relative z-10 -mt-10 px-2 sm:-mt-12 sm:px-6"
        >
          <div className="rounded-3xl border border-ink-200/80 bg-white p-4 shadow-lift sm:p-6">
            <h2 id="mendengarkan" className="sr-only">
              Mendengarkan siaran
            </h2>

            {loadError ? (
              <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                {loadError} Halaman tetap dapat dibuka; silakan coba lagi nanti.
              </p>
            ) : null}

            {canPlay && live?.streamUrl ? (
              isExternal ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-900 text-accent-300">
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-2xl bg-brand-900/20"
                      />
                      <Radio aria-hidden className="relative size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Dengarkan langsung</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                        Siaran dibuka di website radio mitra pada tab baru.
                      </p>
                    </div>
                  </div>

                  <a
                    href={live.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 text-sm font-semibold text-ink-950 shadow-soft transition hover:from-accent-400 hover:to-accent-500"
                  >
                    Dengarkan di radio
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                </div>
              ) : (
                <LiveAudioPlayer src={live.streamUrl} title={live.title} />
              )
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-ink-200 bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-800">
                    Siaran belum mengudara saat ini
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    Lihat jadwal terdekat di bawah, lalu buka halaman ini saat acara dimulai.
                  </p>
                </div>
                <a
                  href="#jadwal-siaran"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-200 bg-white px-4 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Lihat jadwal
                </a>
              </div>
            )}

            {scheduleHint.kind !== 'NONE' ? (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-brand-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                    <Sparkles aria-hidden className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-brand-700 uppercase">
                      {scheduleHint.kind === 'IN_WINDOW' ? 'Sedang berlangsung' : 'Jadwal terdekat'}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink-900">
                      {scheduleHint.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-600">{scheduleHint.label}</p>
                  </div>
                </div>
                <span className="shrink-0 self-start rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-800 ring-1 ring-brand-100 sm:self-center">
                  {relativeDay(scheduleHint.startsAt, now)}
                </span>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-xs leading-relaxed text-ink-500">
                Belum ada jadwal aktif yang bisa ditampilkan. Silakan cek kembali nanti.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {live?.isEnabled && live.streamUrl && live.channelId ? (
                <LiveWatchToggle channelId={live.channelId} />
              ) : (
                <p className="text-xs text-ink-500">
                  Ikuti siaran tersedia saat channel siaran sudah aktif.
                </p>
              )}

              {live?.telegramUrl ? (
                <a
                  href={live.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <Send aria-hidden className="size-4" />
                  Ikuti di Telegram
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-labelledby="jadwal-siaran" className="mt-10 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="jadwal-siaran"
                className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
              >
                Jadwal mingguan
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Semua jam dalam {BROADCAST_TIMEZONE_LABEL} (Asia/Jakarta).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink-600 ring-1 ring-ink-200">
              <span aria-hidden className="size-1.5 rounded-full bg-accent-500" />
              Hari ini: {DAY_OF_WEEK_LABELS[todayWeekday]}
            </span>
          </div>

          {weekly.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-ink-700">Belum ada jadwal mingguan</p>
              <p className="mt-1 text-xs text-ink-500">
                Jadwal rutin akan tampil di sini begitu disimpan admin.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAY_ORDER.map((day) => {
                const items = weekly.filter((schedule) => schedule.dayOfWeek === day);

                if (items.length === 0) return null;

                const isToday = day === todayWeekday;

                return (
                  <div
                    key={day}
                    className={`rounded-3xl border p-4 transition ${
                      isToday
                        ? 'border-accent-300 bg-accent-50/60 shadow-soft ring-1 ring-accent-200'
                        : 'border-ink-200 bg-surface-soft'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">
                        {DAY_OF_WEEK_LABELS[day]}
                      </h3>
                      {isToday ? (
                        <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-950 uppercase">
                          Hari ini
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.map((schedule) => (
                        <ScheduleCard
                          key={`${day}-${schedule.startTime}-${schedule.title}`}
                          schedule={schedule}
                          emphasis={isToday}
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
            <h2
              id="acara-khusus"
              className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
            >
              Acara khusus
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Kajian dan acara sekali jalan di luar jadwal mingguan.
            </p>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {special.map((schedule) => {
                const date = schedule.date ? new Date(`${schedule.date}T00:00:00Z`) : null;

                return (
                  <li key={`${schedule.date}-${schedule.startTime}-${schedule.title}`}>
                    <article className="card-lift flex gap-4 rounded-3xl border border-ink-200 bg-white p-4 shadow-soft hover:border-brand-200">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-900 text-white">
                        <span className="text-lg leading-none font-semibold">
                          {date ? specialDayFormatter.format(date) : '—'}
                        </span>
                        <span className="text-[10px] tracking-wide text-accent-300 uppercase">
                          {date ? specialMonthFormatter.format(date) : ''}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-brand-700">
                          {date ? specialDateFormatter.format(date) : ''}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink-900">
                          {schedule.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-600">
                          {formatTime(schedule.startTime)} · {durationLabel(schedule.durationMin)}
                        </p>
                        {schedule.speakerName ? (
                          <p className="mt-1 text-xs text-ink-500">
                            Pengisi: {schedule.speakerName}
                          </p>
                        ) : null}
                        {schedule.notes ? (
                          <p className="mt-2 text-xs leading-relaxed text-ink-500">
                            {schedule.notes}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
