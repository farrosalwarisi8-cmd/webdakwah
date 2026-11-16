import { CONTENT_TYPE_LABELS, type ContentType } from '@webdakwah/shared';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicApiError, getPublicContent } from '@/lib/api/public';
import { renderBodyHtml } from '@/lib/body-html';
import { CONTENT_SECTIONS, sectionPath } from '@/lib/content-routes';
import { formatDate } from '@/lib/format';

import { AudioDetailPlayer } from './audio-detail-player';
import { BookmarkButton } from './bookmark-button';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

const MEDIA_ACTION_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Buka tautan',
  AUDIO: 'Buka sumber audio',
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
    <div className="min-h-dvh bg-surface-soft">
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
            <span className="inline-flex rounded-lg bg-accent-100 px-2 py-1 text-xs font-semibold tracking-wide text-accent-800">
              {CONTENT_TYPE_LABELS[content.type]}
            </span>
            <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {content.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-500">
                {content.speaker?.name ?? content.author.fullName ?? 'Tim WebDakwah'}
                {content.publishedAt ? ` · ${formatDate(content.publishedAt)}` : null}
              </p>
              <BookmarkButton item={content} />
            </div>

            {content.categories.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/kategori/${encodeURIComponent(category.slug)}`}
                      className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {content.type === 'AUDIO' && content.mediaUrl ? (
              <AudioDetailPlayer
                track={{
                  slug: content.slug,
                  title: content.title,
                  speaker: content.speaker?.name ?? content.author.fullName ?? 'Tim WebDakwah',
                  src: content.mediaUrl,
                }}
              />
            ) : null}

            {content.excerpt ? (
              <p className="mt-6 rounded-r-xl border-l-4 border-accent-400 bg-accent-50 py-3 pr-3 pl-4 text-base leading-relaxed text-ink-700">
                {content.excerpt}
              </p>
            ) : null}

            {content.mediaUrl ? (
              <a
                href={content.mediaUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
              >
                <ExternalLink aria-hidden className="size-4 shrink-0" />
                {MEDIA_ACTION_LABELS[content.type]}
              </a>
            ) : null}

            {content.mediaUrl && content.type !== 'ARTICLE' ? (
              <p className="mt-2 text-xs text-ink-500">Anda akan diarahkan ke website lain.</p>
            ) : null}

            {content.body ? (
              <div
                className="content-body mt-8 text-base leading-relaxed text-ink-800"
                dangerouslySetInnerHTML={{ __html: renderBodyHtml(content.body) }}
              />
            ) : content.type !== 'ARTICLE' ? (
              <p className="mt-8 rounded-2xl bg-ink-100 px-4 py-3 text-sm text-ink-600">
                Konten ini berupa tautan media. Gunakan tombol di atas untuk membukanya.
              </p>
            ) : null}

            {content.links && content.links.length > 0 ? (
              <section className="mt-8 rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-ink-900">Referensi</h2>
                <ul className="mt-3 space-y-2">
                  {content.links.map((link) => (
                    <li key={`${link.order}-${link.url}`}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-sm text-brand-700 transition hover:text-brand-800"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
