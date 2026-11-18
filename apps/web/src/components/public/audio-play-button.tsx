'use client';

import type { PublicContentSummary } from '@webdakwah/shared';
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';

import { useAudioPlayer } from './audio-provider';

type AudioItem = Pick<PublicContentSummary, 'slug' | 'title' | 'mediaUrl' | 'speaker'>;
type Tone = 'accent' | 'light' | 'outline';

const TONE_STYLES: Record<Tone, string> = {
  accent: 'bg-accent-500 text-ink-950 hover:bg-accent-400 focus-visible:outline-ink-950',
  light: 'bg-white text-brand-900 hover:bg-surface-soft focus-visible:outline-white',
  outline: 'border border-white/20 bg-white/10 text-white hover:bg-white/20',
};

const SIZE_STYLES = {
  sm: 'size-11',
  md: 'size-12',
  lg: 'size-14',
} as const;

interface AudioPlayButtonProps {
  item: AudioItem;
  size?: keyof typeof SIZE_STYLES;
  tone?: Tone;
  showLabel?: boolean;
  playLabel?: string;
  className?: string;
}

/**
 * Tombol putar/jeda yang memakai satu audio provider global. Bila audio sudah
 * selesai, tombol berubah menjadi "putar ulang" agar state akhir jelas.
 */
export function AudioPlayButton({
  item,
  size = 'md',
  tone = 'accent',
  showLabel = false,
  playLabel = 'Putar audio',
  className = '',
}: AudioPlayButtonProps) {
  const { track, isPlaying, isBuffering, ended, play, toggle, seek } = useAudioPlayer();

  if (!item.mediaUrl) {
    return null;
  }

  const active = track?.slug === item.slug;
  const playing = active && isPlaying;
  const buffering = active && isBuffering && playing;
  const finished = active && ended;

  const stateLabel = buffering
    ? 'Memuat audio'
    : finished
      ? 'Putar ulang'
      : playing
        ? 'Jeda audio'
        : playLabel;

  const Icon = buffering ? Loader2 : finished ? RotateCcw : playing ? Pause : Play;

  function handleClick() {
    if (!item.mediaUrl) {
      return;
    }

    if (!active) {
      play({
        slug: item.slug,
        title: item.title,
        speaker: item.speaker?.name ?? 'WebDakwah',
        src: item.mediaUrl,
      });

      return;
    }

    if (finished) {
      seek(0);
    }

    toggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${stateLabel}: ${item.title}`}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm ${TONE_STYLES[tone]} ${
        showLabel ? 'min-h-12 px-5 text-sm' : SIZE_STYLES[size]
      } ${className}`}
    >
      <Icon aria-hidden className={`size-4 shrink-0 ${buffering ? 'animate-spin' : ''}`} />
      {showLabel ? <span>{stateLabel}</span> : null}
    </button>
  );
}
