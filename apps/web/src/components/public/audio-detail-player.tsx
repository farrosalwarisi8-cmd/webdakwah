'use client';

import type { CSSProperties } from 'react';
import { Download, Headphones, Loader2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

import { formatDuration } from '@/lib/format';

import { AudioArtwork } from './audio-artwork';
import { useAudioPlayer, type AudioTrack } from './audio-provider';

export function AudioDetailPlayer({ track }: { track: AudioTrack }) {
  const {
    track: activeTrack,
    isPlaying,
    isBuffering,
    ended,
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
  const finished = active && ended;
  const buffering = active && isBuffering;
  const shownTime = active ? currentTime : 0;
  const shownDuration = active ? duration : 0;
  const progress =
    active && shownDuration > 0
      ? Math.min(100, Math.max(0, (shownTime / shownDuration) * 100))
      : 0;

  function handleToggle() {
    if (!active) {
      play(track);
      return;
    }

    if (finished) {
      seek(0);
    }

    toggle();
  }

  const PlayIcon = buffering && playing ? Loader2 : finished ? RotateCcw : playing ? Pause : Play;

  return (
    <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-brand-950 p-5 text-white shadow-panel sm:p-6">
      <div aria-hidden className="pattern-islamic pointer-events-none absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-accent-500/20 blur-3xl"
      />

      <div className="relative grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
        <AudioArtwork
          title={track.title}
          speaker={track.speaker}
          className="mx-auto aspect-square w-full max-w-[200px] border border-white/10 sm:mx-0 sm:max-w-none"
        />

        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-accent-300 uppercase">
              <Headphones aria-hidden className="size-3.5" />
              Audio kajian
            </p>
            <p className="mt-2 line-clamp-2 text-base leading-snug font-semibold text-white sm:text-lg">
              {track.title}
            </p>
            <p className="mt-1 truncate text-xs text-white/70">{track.speaker}</p>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                aria-label={playing ? 'Jeda audio' : finished ? 'Putar ulang audio' : 'Putar audio'}
                className="btn-press grid size-14 shrink-0 place-items-center rounded-full bg-accent-500 text-ink-950 shadow-lg transition hover:bg-accent-400"
              >
                <PlayIcon
                  aria-hidden
                  className={`size-6 ${buffering && playing ? 'animate-spin' : ''} ${
                    !playing && !finished && !buffering ? 'translate-x-px' : ''
                  }`}
                />
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
                  className="audio-range-dark"
                  style={{ '--audio-progress': `${progress}%` } as CSSProperties}
                />
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/65">
                  <span>{formatDuration(shownTime)}</span>
                  <span>{shownDuration > 0 ? formatDuration(shownDuration) : '--:--'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="hidden min-h-11 items-center gap-2 text-white/60 sm:flex">
                <Volume2 aria-hidden className="size-4 shrink-0" />
                <span className="sr-only">Volume audio</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="audio-range-dark w-24"
                  style={
                    { '--audio-progress': `${Math.round(volume * 100)}%` } as CSSProperties
                  }
                />
              </label>

              <a
                href={track.src}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                <Download aria-hidden className="size-4" />
                Unduh audio
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 border-t border-white/10 pt-3">
        {error ? (
          <p role="alert" className="text-xs leading-relaxed text-accent-200">
            {error}
          </p>
        ) : buffering && !playing ? (
          <p role="status" className="flex items-center gap-2 text-xs text-white/70">
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
            Menyiapkan audio…
          </p>
        ) : finished ? (
          <p role="status" className="text-xs text-white/70">
            Audio selesai. Tekan putar ulang untuk menyimak kembali.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-white/60">
            Audio tetap berjalan saat Anda membuka halaman lain. Tekan jeda kapan saja.
          </p>
        )}
      </div>
    </section>
  );
}
