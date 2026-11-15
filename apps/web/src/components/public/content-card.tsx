import { CONTENT_TYPE_LABELS, type PublicContentSummary } from '@webdakwah/shared';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { contentPath } from '@/lib/content-routes';
import { formatDate } from '@/lib/format';

export function PublicContentCard({
  item,
  showType = false,
}: {
  item: PublicContentSummary;
  showType?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-ink-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm sm:p-6">
      <p className="text-xs text-ink-500">
        {showType ? `${CONTENT_TYPE_LABELS[item.type]} · ` : null}
        {item.publishedAt ? formatDate(item.publishedAt) : 'Baru terbit'}
      </p>
      <h3 className="mt-2 text-base leading-snug font-semibold text-ink-900">
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
        className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-brand-700"
      >
        Baca selengkapnya
        <ArrowUpRight aria-hidden className="size-3.5" />
      </Link>
    </article>
  );
}
