'use client';

import type { PublicContentSummary } from '@webdakwah/shared';
import { ArrowRight, CalendarDays, Link2, Play, Tag, UserRound } from 'lucide-react';
import Link from 'next/link';

import { contentPath } from '@/lib/content-routes';
import { CONTENT_TYPE_VISUALS, domainFromUrl } from '@/lib/content-visuals';
import { formatDate } from '@/lib/format';

import { AudioArtwork } from './audio-artwork';
import { AudioPlayButton } from './audio-play-button';

/**
 * Kartu utama di beranda. Panel media dan panel teks dipisah agar konten audio
 * mendapat artwork besar, sementara artikel/video/tautan tetap punya ciri
 * visualnya masing-masing.
 */
export function FeaturedContentCard({ item }: { item: PublicContentSummary }) {
  const visual = CONTENT_TYPE_VISUALS[item.type];
  const Icon = visual.icon;
  const href = contentPath(item.type, item.slug);
  const domain = domainFromUrl(item.mediaUrl);
  const byline = item.speaker?.name ?? item.author.fullName;

  return (
    <article className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-panel">
      <div className="pattern-islamic pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative grid lg:grid-cols-[1.02fr_1fr]">
        <div className="relative min-h-[260px] border-b border-white/10 p-6 sm:min-h-[340px] sm:p-8 lg:min-h-[470px] lg:border-r lg:border-b-0">
          {item.type === 'AUDIO' ? (
            <div className="flex h-full flex-col items-center justify-center gap-5">
              <AudioArtwork
                title={item.title}
                speaker={byline}
                className="aspect-square w-full max-w-[280px] border border-white/10 shadow-2xl"
              />
              <AudioPlayButton item={item} tone="accent" showLabel playLabel="Simak sekarang" />
            </div>
          ) : null}

          {item.type === 'ARTICLE' ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/75">
                  ARTIKEL
                </span>
                <Icon aria-hidden className="size-5 text-white/65" />
              </div>
              <div className="py-6">
                <span
                  aria-hidden="true"
                  className="font-display block text-7xl leading-none text-accent-300"
                >
                  &ldquo;
                </span>
                <p className="mt-2 max-w-sm line-clamp-3 text-lg leading-relaxed text-white/75">
                  {item.excerpt ?? item.title}
                </p>
              </div>
              <p className="flex items-center gap-2 text-xs text-white/65">
                <span className="h-px w-8 bg-accent-400" />
                {item.categories[0]?.name ?? 'Kajian tulis'}
              </p>
            </div>
          ) : null}

          {item.type === 'VIDEO' ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/75">
                  VIDEO
                </span>
                <Icon aria-hidden className="size-5 text-white/65" />
              </div>
              <Link
                href={href}
                aria-label={`Tonton video: ${item.title}`}
                className="group grid place-items-center"
              >
                <span className="grid size-20 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition group-hover:scale-105 group-hover:bg-white group-hover:text-brand-900">
                  <Play aria-hidden className="ml-1 size-7 fill-current" />
                </span>
              </Link>
              <p className="text-xs text-white/65">Tonton kajian langsung dari halaman video.</p>
            </div>
          ) : null}

          {item.type === 'LINK' ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/75">
                  RUJUKAN
                </span>
                <Icon aria-hidden className="size-5 text-white/65" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60">
                  SUMBER
                </p>
                <p className="mt-2 flex items-center gap-2 break-all text-2xl font-semibold text-white sm:text-3xl">
                  <Link2 aria-hidden className="size-6 shrink-0 text-accent-400" />
                  {domain ?? 'Tautan eksternal'}
                </p>
              </div>
              <p className="line-clamp-2 text-sm text-white/70">{item.title}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] ${visual.badge}`}>
              {visual.label}
            </span>
            <span className="text-[11px] font-medium tracking-[0.16em] text-white/60 uppercase">
              Pilihan WebDakwah
            </span>
          </div>

          <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
            <Link href={href} className="transition hover:text-accent-200">
              {item.title}
            </Link>
          </h2>

          {item.excerpt ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65 sm:text-base">
              {item.excerpt}
            </p>
          ) : null}

          <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/70">
            <div className="flex min-w-0 items-center gap-1.5">
              <dt className="sr-only">Penulis atau penceramah</dt>
              <UserRound aria-hidden className="size-3.5 shrink-0 text-accent-400" />
              <dd className="truncate">{byline}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Tanggal terbit</dt>
              <CalendarDays aria-hidden className="size-3.5 shrink-0 text-accent-400" />
              <dd>{item.publishedAt ? formatDate(item.publishedAt) : 'Baru terbit'}</dd>
            </div>
            {item.categories[0] ? (
              <div className="flex min-w-0 items-center gap-1.5">
                <dt className="sr-only">Kategori</dt>
                <Tag aria-hidden className="size-3.5 shrink-0 text-accent-400" />
                <dd className="truncate">{item.categories[0].name}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {item.type === 'AUDIO' ? (
              <Link
                href={href}
                className="btn-press inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Buka halaman audio
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <Link
                href={href}
                className="btn-press inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-500 px-5 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
              >
                {visual.featuredCta}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
