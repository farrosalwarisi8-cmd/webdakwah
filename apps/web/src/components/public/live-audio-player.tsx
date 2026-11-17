'use client';

import { Pause, Play, Volume2 } from 'lucide-react';

import { useAudioPlayer } from './audio-provider';

const LIVE_TRACK_SLUG = 'siaran-langsung';

/**
 * Pemutar siaran memakai audio provider global yang sudah ada, sehingga
 * mini-player tetap bekerja saat pengunjung berpindah halaman. Tidak ada
 * autoplay: audio baru dimuat dan diputar setelah tombol ditekan.
 */
export function LiveAudioPlayer({ src, title }: { src: string; title: string }) {
  const { track, isPlaying, volume, play, toggle, setVolume, error } = useAudioPlayer();
  const active = track?.slug === LIVE_TRACK_SLUG;
  const playing = active && isPlaying;

  function handleToggle() {
    if (active) {
      toggle();
      return;
    }

    play({ slug: LIVE_TRACK_SLUG, title, speaker: 'Siaran langsung', src });
  }

  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={playing ? 'Jeda siaran' : 'Putar siaran'}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {playing ? (
            <Pause aria-hidden className="size-4" />
          ) : (
            <Play aria-hidden className="size-4" />
          )}
          {playing ? 'Jeda siaran' : 'Putar siaran'}
        </button>

        <label className="flex min-h-12 flex-1 items-center gap-3 text-sm text-ink-600">
          <Volume2 aria-hidden className="size-4 shrink-0" />
          <span className="sr-only">Volume siaran</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.currentTarget.value))}
            className="w-full accent-brand-600"
          />
        </label>
      </div>

      {active && error ? (
        <p
          role="status"
          className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900"
        >
          Siaran sedang tidak mengudara. Lihat jadwal di bawah.
        </p>
      ) : null}
    </div>
  );
}
