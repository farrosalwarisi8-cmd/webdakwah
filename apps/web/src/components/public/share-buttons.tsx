'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { SharePayload } from '@/lib/share';

type CopyState = 'idle' | 'copied' | 'error';

/**
 * Tombol bagikan. Web Share API hanya ditampilkan bila peramban mendukungnya;
 * WhatsApp dan "Salin tautan" selalu tersedia sebagai cadangan. Tidak ada
 * pustaka pihak ketiga dan tidak ada permintaan jaringan dari komponen ini.
 */
export function ShareButtons({ title, url, whatsappUrl }: SharePayload) {
  const [canShare, setCanShare] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');

    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
    }

    copyTimer.current = setTimeout(() => setCopyState('idle'), 4000);
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Pengguna menutup dialog bagikan atau peramban menolak; tidak perlu galat.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canShare ? (
        <button
          type="button"
          onClick={share}
          className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          <Share2 aria-hidden className="size-4" />
          Bagikan
        </button>
      ) : null}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Share2 aria-hidden className="size-4" />
        WhatsApp
      </a>

      <button
        type="button"
        onClick={copyLink}
        className="btn-press inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
      >
        {copyState === 'copied' ? (
          <Check aria-hidden className="size-4 text-brand-600" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
        {copyState === 'copied' ? 'Tautan disalin' : 'Salin tautan'}
      </button>

      <p aria-live="polite" className="sr-only">
        {copyState === 'copied' ? 'Tautan berhasil disalin.' : ''}
        {copyState === 'error' ? 'Tautan tidak bisa disalin otomatis.' : ''}
      </p>

      {copyState === 'error' ? (
        <p className="basis-full text-xs leading-relaxed text-ink-600">
          Tautan tidak bisa disalin otomatis. Salin manual:{' '}
          <span className="break-all select-all text-ink-800">{url}</span>
        </p>
      ) : null}
    </div>
  );
}
