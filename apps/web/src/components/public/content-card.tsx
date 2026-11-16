import {
  CONTENT_TYPE_LABELS,
  type ContentType,
  type PublicContentSummary,
} from '@webdakwah/shared';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { contentPath } from '@/lib/content-routes';
import { formatDate } from '@/lib/format';

const TYPE_BADGE_STYLES: Record<ContentType, string> = {
  ARTICLE: 'bg-brand-50 text-brand-700',
  AUDIO: 'bg-accent-100 text-accent-800',
  VIDEO: 'bg-rose-50 text-rose-700',
  LINK: 'bg-ink-100 text-ink-700',
};

const TYPE_ACTIONS: Record<ContentType, string> = {
  ARTICLE: 'Baca artikel',
  AUDIO: 'Simak audio',
  VIDEO: 'Tonton video',
  LINK: 'Buka rujukan',
};

export function PublicContentCard({ item }: { item: PublicContentSummary }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_8px_24px_rgba(23,59,50,0.04)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_8px_24px_rgba(23,59,50,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold tracking-wide ${TYPE_BADGE_STYLES[item.type]}`}
        >
          {CONTENT_TYPE_LABELS[item.type]}
        </span>
        <p className="text-xs text-ink-500">
          {item.publishedAt ? formatDate(item.publishedAt) : 'Baru terbit'}
        </p>
      </div>

      <h3 className="mt-3 line-clamp-3 text-base leading-snug font-semibold text-ink-900">
        <Link
          href={contentPath(item.type, item.slug)}
          className="transition group-hover:text-brand-700"
        >
          {item.title}
        </Link>
      </h3>
      {item.excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">{item.excerpt}</p>
      ) : null}

      <Link
        href={contentPath(item.type, item.slug)}
        className="mt-auto inline-flex min-h-11 items-center gap-1 pt-4 text-xs font-semibold text-brand-700"
      >
        {TYPE_ACTIONS[item.type]}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </Link>
    </article>
  );
}
