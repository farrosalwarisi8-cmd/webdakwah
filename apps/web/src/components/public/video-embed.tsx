'use client';

import type { VideoEmbed } from '@webdakwah/shared';
import { ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';

/**
 * Iframe pihak ketiga baru dimuat setelah pengunjung menekan tombol putar,
 * sehingga tidak ada cookie/pelacak yang jalan saat halaman dibuka.
 */
const IFRAME_ALLOW =
  'accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

export function VideoEmbedPlayer({ embed, title }: { embed: VideoEmbed; title: string }) {
  const [diputar, setDiputar] = useState(false);
  const potret = embed.aspectRatio !== '16 / 9';

  return (
    <figure className="mt-4">
      <div className={potret ? 'mx-auto w-full max-w-[19rem]' : 'w-full'}>
        <div
          className="relative overflow-hidden rounded-2xl bg-sea-950"
          style={{ aspectRatio: embed.aspectRatio }}
        >
          {diputar ? (
            <iframe
              src={embed.embedUrl}
              title={`Video: ${title}`}
              className="absolute inset-0 size-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              allow={IFRAME_ALLOW}
              allowFullScreen
            />
          ) : (
            <>
              <span aria-hidden className="pattern-islamic absolute inset-0 opacity-50" />
              <button
                type="button"
                onClick={() => setDiputar(true)}
                aria-label={`Putar video ${embed.providerLabel}: ${title}`}
                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
              >
                <span className="grid size-16 place-items-center rounded-full bg-white/95 text-sea-900 shadow-lg transition group-hover:scale-105 group-hover:bg-white motion-reduce:transform-none">
                  <Play aria-hidden className="ml-1 size-6 fill-current" />
                </span>
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                  Putar video {embed.providerLabel}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
        <span>Video dari {embed.providerLabel}.</span>
        <a
          href={embed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-8 items-center gap-1 text-brand-700 transition hover:text-brand-900 hover:underline"
        >
          Tonton di sumber asli
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </figcaption>
    </figure>
  );
}
