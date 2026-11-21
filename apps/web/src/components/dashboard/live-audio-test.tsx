'use client';

import { Loader2, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type TestState =
  { kind: 'idle' } | { kind: 'testing' } | { kind: 'success' } | { kind: 'error'; message: string };

const TEST_TIMEOUT_MS = 8_000;

/**
 * Tombol "Tes dengar" di dashboard: memutar alamat stream sebentar di browser
 * admin untuk memastikan alamatnya benar. Tidak menyimpan apa pun.
 */
export function LiveAudioTest({ inputId }: { inputId: string }) {
  const [state, setState] = useState<TestState>({ kind: 'idle' });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function fail(message: string) {
    if (settledRef.current) return;

    settledRef.current = true;
    cleanup();
    setState({ kind: 'error', message });
  }

  function handleTest() {
    cleanup();

    const input = document.getElementById(inputId);

    if (!(input instanceof HTMLInputElement)) {
      fail('Kolom alamat dengar tidak ditemukan. Muat ulang halaman lalu coba lagi.');
      return;
    }

    const value = input.value.trim();

    if (!value) {
      fail('Isi alamat dengar publik terlebih dahulu, lalu tekan Tes dengar.');
      return;
    }

    try {
      const parsed = new URL(value);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        fail('Alamat harus diawali http:// atau https://.');
        return;
      }
    } catch {
      fail('Alamat tidak valid. Pastikan diawali http:// atau https://.');
      return;
    }

    settledRef.current = false;
    setState({ kind: 'testing' });

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 0.4;
    audioRef.current = audio;

    audio.onplaying = () => {
      if (settledRef.current) return;

      settledRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setState({ kind: 'success' });

      // Hentikan setelah beberapa detik; tes hanya memastikan audio berbunyi.
      timerRef.current = setTimeout(() => {
        cleanup();
        setState({ kind: 'idle' });
      }, 5_000);
    };

    audio.onerror = () => {
      fail(
        'Gagal memutar alamat ini. Pastikan itu alamat stream langsung (bukan halaman web radio) dan siaran sedang berjalan.',
      );
    };

    timerRef.current = setTimeout(() => {
      fail(
        'Alamat tidak merespons dalam 8 detik. Bisa jadi siaran sedang berhenti atau alamat bukan stream langsung.',
      );
    }, TEST_TIMEOUT_MS);

    audio.src = value;
    void audio.play().catch(() => {
      fail(
        'Browser menolak memutar alamat ini. Coba alamat stream https langsung, atau buka di tab baru.',
      );
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={state.kind === 'testing'}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.kind === 'testing' ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Volume2 aria-hidden className="size-4" />
        )}
        {state.kind === 'testing' ? 'Menguji…' : 'Tes dengar'}
      </button>

      {state.kind === 'success' ? (
        <p role="status" className="mt-2 text-xs text-emerald-700">
          Berhasil: alamat merespons dan audio mulai diputar. Pemutar berhenti otomatis.
        </p>
      ) : null}

      {state.kind === 'error' ? (
        <p role="status" className="mt-2 text-xs leading-relaxed text-amber-900">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
