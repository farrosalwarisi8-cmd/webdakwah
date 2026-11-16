'use client';

import { Headphones, Pause, Play, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { contentPath } from '@/lib/content-routes';
import { formatDuration } from '@/lib/format';

import { useAudioPlayer } from './audio-provider';

export function AudioMiniPlayer() {
  const { track, isPlaying, currentTime, duration, error, toggle, close } = useAudioPlayer();
  const pathname = usePathname();

  if (!track || pathname.startsWith('/masuk')) {
    return null;
  }

  const isDashboard = pathname.startsWith('/dashboard');
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`fixed inset-x-3 z-50 mx-auto max-w-2xl sm:inset-x-6 ${
        isDashboard ? 'bottom-4' : 'bottom-[4.75rem] sm:bottom-6'
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_10px_30px_rgba(14,42,36,0.16)]">
        <div className="h-1 bg-ink-100">
          <div
            className="h-full bg-accent-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700">
            <Headphones aria-hidden className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <Link
              href={contentPath('AUDIO', track.slug)}
              className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
            >
              {track.title}
            </Link>
            <p className="truncate text-xs text-ink-500">
              {error ??
                `${track.speaker} · ${formatDuration(currentTime)} / ${formatDuration(duration)}`}
            </p>
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? 'Jeda audio' : 'Putar audio'}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800"
          >
            {isPlaying ? (
              <Pause aria-hidden className="size-4" />
            ) : (
              <Play aria-hidden className="size-4 translate-x-px" />
            )}
          </button>

          <button
            type="button"
            onClick={close}
            aria-label="Tutup pemutar audio"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
