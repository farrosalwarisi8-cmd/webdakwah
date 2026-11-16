import { CONTENT_TYPE_LABELS, type PublicContentSummary } from '@webdakwah/shared';
import { ArrowUpRight, BookOpen, Headphones, Link2, Video, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { contentPath } from '@/lib/content-routes';
import { formatDate } from '@/lib/format';

const TYPE_ICONS: Record<PublicContentSummary['type'], LucideIcon> = {
  ARTICLE: BookOpen,
  AUDIO: Headphones,
  VIDEO: Video,
  LINK: Link2,
};

export function FeaturedContentCard({ item }: { item: PublicContentSummary }) {
  const Icon = TYPE_ICONS[item.type];

  return (
    <article className="relative isolate overflow-hidden rounded-3xl bg-ink-900 p-6 text-white shadow-[0_10px_30px_rgba(14,42,36,0.16)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-accent-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent-200">
          <Icon aria-hidden className="size-3.5" />
          {CONTENT_TYPE_LABELS[item.type]}
        </span>
        <span className="text-xs text-ink-300">Kajian pilihan</span>
      </div>

      <h2 className="relative mt-6 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
        <Link href={contentPath(item.type, item.slug)} className="transition hover:text-accent-200">
          {item.title}
        </Link>
      </h2>

      {item.excerpt ? (
        <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-ink-200">
          {item.excerpt}
        </p>
      ) : null}

      <div className="relative mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-300">
        <span>{item.speaker?.name ?? item.author.fullName ?? 'Tim WebDakwah'}</span>
        {item.publishedAt ? (
          <>
            <span aria-hidden>·</span>
            <span>{formatDate(item.publishedAt)}</span>
          </>
        ) : null}
      </div>

      <Link
        href={contentPath(item.type, item.slug)}
        className="relative mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
      >
        {item.type === 'AUDIO'
          ? 'Simak sekarang'
          : item.type === 'VIDEO'
            ? 'Tonton sekarang'
            : 'Baca sekarang'}
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </article>
  );
}
