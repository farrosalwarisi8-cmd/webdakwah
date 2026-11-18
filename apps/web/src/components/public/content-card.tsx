'use client';

import type { PublicContentSummary } from '@webdakwah/shared';
import { ArrowUpRight, BookOpen, Headphones, Link2, Play, Video } from 'lucide-react';
import Link from 'next/link';

import { contentPath } from '@/lib/content-routes';
import { CONTENT_TYPE_VISUALS, domainFromUrl } from '@/lib/content-visuals';
import { formatDate } from '@/lib/format';

import { AudioPlayButton } from './audio-play-button';
import { useAudioPlayer } from './audio-provider';

const MEDIA_ASPECT: Record<PublicContentSummary['type'], string> = {
  ARTICLE: 'aspect-[16/10]',
  AUDIO: 'aspect-square',
  VIDEO: 'aspect-[4/5]',
  LINK: 'aspect-[16/9]',
};

function mediaMeta(item: PublicContentSummary): string {
  if (item.type === 'LINK') {
    return domainFromUrl(item.mediaUrl) ?? 'Sumber eksternal';
  }

  return item.speaker?.name ?? item.author.fullName ?? 'Tim WebDakwah';
}

export function PublicContentCard({ item }: { item: PublicContentSummary }) {
  const visual = CONTENT_TYPE_VISUALS[item.type];
  const Icon = visual.icon;
  const { track, currentTime, duration } = useAudioPlayer();
  const activeAudio = item.type === 'AUDIO' && track?.slug === item.slug;
  const progress = activeAudio && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const domain = domainFromUrl(item.mediaUrl);

  return (
    <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-soft hover:border-brand-200">
      <div
        className={`relative isolate overflow-hidden ${MEDIA_ASPECT[item.type]} ${
          item.type === 'LINK' ? 'bg-surface-soft' : visual.mediaPanel
        }`}
      >
        {item.type === 'LINK' ? (
          <>
            <div className="pattern-islamic-ink absolute inset-0 opacity-80" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <span className="grid size-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 shadow-sm">
                <Link2 aria-hidden className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-ink-600">
                  SUMBER EKSTERNAL
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-base font-semibold text-brand-900">
                  {domain ?? 'Tautan rujukan'}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-brand-600" />
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="pattern-islamic absolute inset-0 opacity-60" />
            <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5 blur-2xl" />

            {item.type === 'ARTICLE' ? (
              <div className="relative flex h-full flex-col justify-between p-5">
                <span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white">
                  <BookOpen aria-hidden className="size-4" />
                </span>
                <div className="flex items-end justify-between gap-3">
                  <p className="max-w-[70%] text-xs leading-relaxed text-white/55">
                    {item.categories[0]?.name ?? 'Kajian tulis'}
                  </p>
                  <BookOpen aria-hidden className="size-16 text-white/10" />
                </div>
              </div>
            ) : null}

            {item.type === 'AUDIO' ? (
              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-accent-300">
                    <Headphones aria-hidden className="size-4" />
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-white/45">
                    AUDIO
                  </span>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex h-5 items-end gap-1" aria-hidden="true">
                      {[9, 16, 11, 20, 14, 22, 12, 18, 8, 15].map((height, index) => (
                        <span
                          key={`${height}-${index}`}
                          className="w-1 rounded-full bg-accent-400/60"
                          style={{ height }}
                        />
                      ))}
                    </div>
                    <p className="truncate text-xs text-white/65">
                      {item.speaker?.name ?? 'Audio kajian'}
                    </p>
                  </div>
                  <AudioPlayButton item={item} tone="light" size="sm" />
                </div>
              </div>
            ) : null}

            {item.type === 'VIDEO' ? (
              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/80">
                    VIDEO
                  </span>
                  <Video aria-hidden className="size-5 text-white/40" />
                </div>

                <Link
                  href={contentPath(item.type, item.slug)}
                  aria-label={`Tonton video: ${item.title}`}
                  className="absolute inset-0 grid place-items-center"
                >
                  <span className="btn-press grid size-14 place-items-center rounded-full bg-white/95 text-brand-900 shadow-lg transition group-hover:scale-105 group-hover:bg-white">
                    <Play aria-hidden className="ml-0.5 size-5 fill-current" />
                  </span>
                </Link>

                <p className="truncate text-xs text-white/70">
                  {item.speaker?.name ?? 'Video dakwah'}
                </p>
              </div>
            ) : null}
          </>
        )}

        {activeAudio ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15" aria-hidden="true">
            <div
              className="h-full bg-accent-400 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold tracking-[0.12em] ${visual.badge}`}
          >
            <Icon aria-hidden className="size-3" />
            {visual.label}
          </span>
          <span className="text-xs text-ink-600">
            {item.publishedAt ? formatDate(item.publishedAt) : 'Baru terbit'}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-[17px] leading-snug font-semibold text-ink-900">
          <Link
            href={contentPath(item.type, item.slug)}
            className="transition group-hover:text-brand-700"
          >
            {item.title}
          </Link>
        </h3>

        {item.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{item.excerpt}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-3.5">
          <p className="min-w-0 truncate text-xs text-ink-600">{mediaMeta(item)}</p>
          <Link
            href={contentPath(item.type, item.slug)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-900"
          >
            {visual.action}
            <ArrowUpRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
