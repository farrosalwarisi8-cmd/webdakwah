'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isLiveTrack, playbackErrorMessage } from '@/lib/live-audio';

export interface AudioTrack {
  slug: string;
  title: string;
  speaker: string;
  src: string;
  /** Trek siaran langsung: tanpa durasi, progres, atau seek. */
  isLive?: boolean;
}

interface AudioPlayerContextValue {
  track: AudioTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  ended: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  play: (track: AudioTrack) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAudioPlayer harus dipakai di dalam AudioProvider.');
  }

  return context;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(
    (next: AudioTrack) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      setError(null);
      setEnded(false);

      // Stream langsung tidak punya posisi; muat ulang agar kembali ke siaran
      // saat ini, bukan melanjutkan buffer lama.
      const reloadLive = isLiveTrack(next);

      if (track?.slug === next.slug) {
        if (audio.paused) {
          setIsBuffering(true);

          if (reloadLive) {
            audio.src = next.src;
            audio.load();
          }

          void audio.play().catch(() => {
            setError(playbackErrorMessage(next));
            setIsPlaying(false);
            setIsBuffering(false);
          });
        } else {
          audio.pause();
        }

        return;
      }

      setTrack(next);
      setCurrentTime(0);
      setDuration(0);
      setIsBuffering(true);
      audio.src = next.src;
      audio.load();

      void audio.play().catch(() => {
        setError(playbackErrorMessage(next));
        setIsPlaying(false);
        setIsBuffering(false);
      });
    },
    [track?.slug],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || !track) {
      return;
    }

    if (audio.paused) {
      setError(null);
      setEnded(false);
      setIsBuffering(true);

      // Siaran dilanjutkan dari titik sekarang, bukan dari buffer yang dijeda.
      if (isLiveTrack(track)) {
        audio.src = track.src;
        audio.load();
      }

      void audio.play().catch(() => {
        setError(playbackErrorMessage(track));
        setIsPlaying(false);
        setIsBuffering(false);
      });
    } else {
      audio.pause();
    }
  }, [track]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(seconds)) {
      return;
    }

    audio.currentTime = seconds;
    setCurrentTime(seconds);
    setEnded(false);
  }, []);

  const setVolume = useCallback((next: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(next)) {
      return;
    }

    const clamped = Math.min(1, Math.max(0, next));
    audio.volume = clamped;
    setVolumeState(clamped);
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    setTrack(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setEnded(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, []);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      track,
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
      close,
    }),
    [
      track,
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
      close,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        onPlay={() => {
          setIsPlaying(true);
          setEnded(false);
        }}
        onPlaying={() => setIsBuffering(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          setEnded(true);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0,
          )
        }
        onError={() => {
          setError(
            isLiveTrack(track ?? { slug: '' })
              ? playbackErrorMessage(track)
              : 'Audio tidak dapat dimuat. Coba buka sumber aslinya.',
          );
          setIsPlaying(false);
          setIsBuffering(false);
        }}
      />
    </AudioPlayerContext.Provider>
  );
}
