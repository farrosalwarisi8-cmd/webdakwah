import { CONTENT_TYPE_LABELS, type ContentType } from '@webdakwah/shared';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicApiError, getPublicContent } from '@/lib/api/public';
import { CONTENT_SECTIONS, sectionPath } from '@/lib/content-routes';
import { formatDate } from '@/lib/format';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

const MEDIA_ACTION_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Buka tautan',
  AUDIO: 'Simak audio',
  VIDEO: 'Tonton video',
  LINK: 'Buka rujukan',
};

export async function ContentDetailPage({ type, slug }: { type: ContentType; slug: string }) {
  const section = CONTENT_SECTIONS[type];

  let content = null;
  let error: string | null = null;

  try {
    content = await getPublicContent(slug);
  } catch (caught) {
    if (caught instanceof PublicApiError && caught.status === 404) {
      notFound();
    }

    error =
      caught instanceof PublicApiError
        ? caught.message
        : 'Konten belum bisa dimuat. Coba lagi beberapa saat.';
  }

  if (content && content.type !== type) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href={sectionPath(type)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {section.title}
        </Link>

        {error || !content ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
            {error ?? 'Konten tidak ditemukan.'}
          </div>
        ) : (
          <article className="mt-5">
            <p className="text-xs font-medium text-brand-700">
              {CONTENT_TYPE_LABELS[content.type]}
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 text-xs text-ink-500">
              {content.author.fullName ?? 'Tim WebDakwah'}
              {content.publishedAt ? ` · ${formatDate(content.publishedAt)}` : null}
            </p>

            {content.excerpt ? (
              <p className="mt-6 border-l-2 border-brand-300 pl-4 text-base leading-relaxed text-ink-600">
                {content.excerpt}
              </p>
            ) : null}

            {content.mediaUrl ? (
              <a
                href={content.mediaUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                <ExternalLink aria-hidden className="size-4 shrink-0" />
                {MEDIA_ACTION_LABELS[content.type]}
              </a>
            ) : null}

            {content.body ? (
              <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-ink-800">
                {content.body}
              </div>
            ) : content.type !== 'ARTICLE' ? (
              <p className="mt-8 rounded-2xl bg-ink-100 px-4 py-3 text-sm text-ink-600">
                Konten ini berupa tautan media. Gunakan tombol di atas untuk membukanya.
              </p>
            ) : null}
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
