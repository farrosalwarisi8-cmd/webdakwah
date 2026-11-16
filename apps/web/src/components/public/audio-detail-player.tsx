'use client';

import { Headphones, Pause, Play, Volume2 } from 'lucide-react';

import { formatDuration } from '@/lib/format';

import { useAudioPlayer, type AudioTrack } from './audio-provider';

export function AudioDetailPlayer({ track }: { track: AudioTrack }) {
  const {
    track: activeTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    play,
    toggle,
    seek,
    setVolume,
  } = useAudioPlayer();

  const active = activeTrack?.slug === track.slug;
  const playing = active && isPlaying;
  const shownTime = active ? currentTime : 0;
  const shownDuration = active ? duration : 0;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-ink-200 bg-white p-5 shadow-[0_8px_24px_rgba(23,59,50,0.06)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-100 text-accent-700">
          <Headphones aria-hidden className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-ink-500">Audio kajian</p>
          <p className="truncate text-sm font-semibold text-ink-900">{track.title}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (active ? toggle() : play(track))}
          aria-label={playing ? 'Jeda audio' : 'Putar audio'}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800"
        >
          {playing ? (
            <Pause aria-hidden className="size-5" />
          ) : (
            <Play aria-hidden className="size-5 translate-x-px" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={shownDuration || 0}
            step={1}
            value={Math.min(shownTime, shownDuration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!active || shownDuration <= 0}
            aria-label="Posisi audio"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-100 accent-accent-500 disabled:cursor-not-allowed"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-500">
            <span>{formatDuration(shownTime)}</span>
            <span>{formatDuration(shownDuration)}</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Volume2 aria-hidden className="size-4 text-ink-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Volume audio"
            className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-ink-100 accent-accent-500"
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-xs leading-relaxed text-danger">{error}</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        Audio tetap berjalan saat Anda membuka halaman lain. Tekan jeda kapan saja.
      </p>
    </section>
  );
}
