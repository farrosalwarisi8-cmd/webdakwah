'use client';

import { Loader2, Maximize2, Pause, Play, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { formatTrackMeta, isLiveTrack, progressPercent, trackHref } from '@/lib/live-audio';

import { AudioArtwork } from './audio-artwork';
import { useAudioPlayer } from './audio-provider';

export function AudioMiniPlayer() {
  const {
    track,
    isPlaying,
    isBuffering,
    ended,
    currentTime,
    duration,
    error,
    toggle,
    seek,
    close,
  } = useAudioPlayer();
  const pathname = usePathname();

  if (!track || pathname.startsWith('/masuk')) {
    return null;
  }

  const isDashboard = pathname.startsWith('/dashboard');
  const live = isLiveTrack(track);
  const href = trackHref(track);
  const linkLabel = live ? 'Buka halaman siaran' : `Buka halaman audio: ${track.title}`;
  const progress = progressPercent(track, currentTime, duration);
  const PlayIcon =
    isBuffering && isPlaying ? Loader2 : ended ? RotateCcw : isPlaying ? Pause : Play;

  function handleToggle() {
    if (ended) {
      seek(0);
    }

    toggle();
  }

  return (
    <div
      className={`fixed inset-x-3 z-50 mx-auto max-w-2xl sm:inset-x-6 ${
        isDashboard ? 'bottom-4' : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6'
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/95 shadow-lift backdrop-blur-md">
        {live ? null : (
          <div className="h-1 bg-ink-100" aria-hidden="true">
            <div
              className="h-full bg-accent-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-2.5">
          <Link
            href={href}
            aria-label={linkLabel}
            className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <AudioArtwork title={track.title} compact className="size-11 rounded-xl" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {live ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-800">
                  <span aria-hidden className="size-1.5 rounded-full bg-accent-600" />
                  LANGSUNG
                </span>
              ) : null}
              <Link
                href={href}
                className="line-clamp-2 min-w-0 text-[12px] leading-tight font-semibold text-ink-900 hover:text-brand-700 sm:text-[13px]"
              >
                {track.title}
              </Link>
            </div>
            <p className="truncate text-[11px] text-ink-600">
              {error ? (
                <span className="text-danger">{error}</span>
              ) : (
                formatTrackMeta(track, {
                  currentTime,
                  duration,
                  isBuffering: isBuffering && isPlaying,
                  ended,
                })
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            aria-label={isPlaying ? 'Jeda audio' : ended ? 'Putar ulang audio' : 'Putar audio'}
            className="btn-press grid size-11 shrink-0 place-items-center rounded-full bg-brand-900 text-white transition hover:bg-brand-800"
          >
            <PlayIcon
              aria-hidden
              className={`size-4 ${isBuffering && isPlaying ? 'animate-spin' : ''} ${
                !isPlaying && !ended ? 'translate-x-px' : ''
              }`}
            />
          </button>

          <Link
            href={href}
            aria-label={linkLabel}
            className="btn-press hidden size-11 shrink-0 place-items-center rounded-full text-ink-600 transition hover:bg-ink-100 hover:text-ink-800 sm:grid"
          >
            <Maximize2 aria-hidden className="size-4" />
          </Link>

          <button
            type="button"
            onClick={close}
            aria-label="Tutup pemutar audio"
            className="btn-press grid size-11 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
