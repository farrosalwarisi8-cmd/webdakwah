import { type ContentType } from '@webdakwah/shared';
import { ArrowLeft, ExternalLink, Play, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicApiError, getPublicContent } from '@/lib/api/public';
import { renderBodyHtml } from '@/lib/body-html';
import { CONTENT_SECTIONS, sectionPath } from '@/lib/content-routes';
import { CONTENT_TYPE_VISUALS, domainFromUrl } from '@/lib/content-visuals';
import { formatDate } from '@/lib/format';

import { AudioDetailPlayer } from './audio-detail-player';
import { BookmarkButton } from './bookmark-button';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { VideoEmbedPlayer } from './video-embed';
import { getVideoEmbed, isDirectVideoFileUrl } from '@webdakwah/shared';
import type { JSX } from 'react';

const MEDIA_ACTION_LABELS: Record<ContentType, string> = {
  ARTICLE: 'Buka tautan',
  AUDIO: 'Buka sumber audio',
  VIDEO: 'Tonton video',
  LINK: 'Buka rujukan',
};

export async function ContentDetailPage({ type, slug }: { type: ContentType; slug: string }) {
  const section = CONTENT_SECTIONS[type];
  const visual = CONTENT_TYPE_VISUALS[type];
  const Icon = visual.icon;

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

  const byline = content?.speaker?.name ?? content?.author.fullName ?? 'Tim WebDakwah';
  const bylineLabel = content?.speaker ? 'Penceramah' : 'Penulis';

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={sectionPath(type)}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-600 transition hover:text-brand-700"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Kembali ke {section.title}
        </Link>

        {error || !content ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800"
          >
            {error ?? 'Konten tidak ditemukan.'}
          </div>
        ) : (
          <article className="mt-4">
            <header className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] ${visual.badge}`}
                >
                  <Icon aria-hidden className="size-3.5" />
                  {visual.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
                  <ShieldCheck aria-hidden className="size-3.5 text-brand-600" />
                  Sudah ditinjau
                </span>
              </div>

              <h1 className="mt-4 text-3xl leading-[1.15] font-bold tracking-tight text-ink-900 text-balance sm:text-4xl lg:text-[2.75rem]">
                {content.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-800">{byline}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {content.publishedAt ? formatDate(content.publishedAt) : 'Baru terbit'}
                    {content.categories[0] ? ` · ${content.categories[0].name}` : ''}
                  </p>
                </div>
                <BookmarkButton item={content} />
              </div>

              {content.categories.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {content.categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/kategori/${encodeURIComponent(category.slug)}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-ink-200 bg-white px-3.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </header>

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,46rem)_19rem] lg:items-start lg:justify-between">
              <div className="min-w-0">
                {content.type === 'VIDEO' && content.mediaUrl
                  ? renderVideoMedia(content.mediaUrl, content.title)
                  : null}

                {content.excerpt ? (
                  <p className="rounded-r-2xl border-l-4 border-accent-400 bg-surface-soft py-3.5 pr-4 pl-5 text-base leading-relaxed text-ink-700">
                    {content.excerpt}
                  </p>
                ) : null}

                {!content.mediaUrl && content.type !== 'ARTICLE' ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-ink-200 bg-surface-soft p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-ink-500">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-800">
                        {content.type === 'AUDIO'
                          ? 'Sumber audio belum tersedia'
                          : content.type === 'VIDEO'
                            ? 'Tautan video belum tersedia'
                            : 'Tautan sumber belum tersedia'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-600">
                        Tim WebDakwah belum menambahkan alamat media untuk kajian ini. Isi kajian
                        tetap bisa dibaca, dan tombol sumber akan muncul otomatis saat tautan
                        tersedia.
                      </p>
                    </div>
                  </div>
                ) : null}

                {content.type === 'AUDIO' && content.mediaUrl ? (
                  <AudioDetailPlayer
                    track={{
                      slug: content.slug,
                      title: content.title,
                      speaker: byline,
                      src: content.mediaUrl,
                    }}
                  />
                ) : null}

                {content.type === 'AUDIO' && content.transcript ? (
                  <details className="group mt-4 rounded-2xl border border-ink-200 bg-white">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-ink-900">
                      Transkrip kajian
                      <span className="text-xs font-normal text-ink-600 group-open:hidden">
                        Buka
                      </span>
                      <span className="hidden text-xs font-normal text-ink-600 group-open:inline">
                        Tutup
                      </span>
                    </summary>
                    <div className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                      {content.transcript}
                    </div>
                  </details>
                ) : null}

                {content.body ? (
                  <div
                    className="content-body mt-7 text-base leading-relaxed text-ink-800"
                    dangerouslySetInnerHTML={{ __html: renderBodyHtml(content.body) }}
                  />
                ) : content.type !== 'ARTICLE' && content.mediaUrl ? (
                  <p className="mt-7 rounded-2xl bg-surface-soft px-4 py-3.5 text-sm leading-relaxed text-ink-600">
                    Konten ini berupa tautan media. Gunakan tombol sumber untuk membukanya.
                  </p>
                ) : null}

                {content.links && content.links.length > 0 ? (
                  <section className="mt-8 rounded-2xl border border-ink-200 bg-white p-5">
                    <h2 className="text-sm font-semibold text-ink-900">Referensi</h2>
                    <ul className="mt-3 space-y-2.5">
                      {content.links.map((link) => (
                        <li key={`${link.order}-${link.url}`} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-2 size-1 shrink-0 rounded-full bg-accent-500"
                          />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex min-h-8 items-center text-sm text-brand-700 transition hover:text-brand-900 hover:underline"
                          >
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {content.mediaUrl ? (
                  <div className="mt-8 lg:hidden">
                    <a
                      href={content.mediaUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-press inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-500 px-5 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
                    >
                      <ExternalLink aria-hidden className="size-4 shrink-0" />
                      {MEDIA_ACTION_LABELS[content.type]}
                    </a>
                    {content.type !== 'ARTICLE' ? (
                      <p className="mt-2 text-xs text-ink-600">
                        Anda akan diarahkan ke website lain.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <aside className="lg:sticky lg:top-24">
                <div className="rounded-3xl border border-ink-200/80 bg-surface-soft p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${visual.iconWrap}`}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-600 uppercase">
                        Jenis konten
                      </p>
                      <p className="text-sm font-semibold text-ink-900">{visual.label}</p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 border-t border-ink-200/80 pt-4 text-sm">
                    <div>
                      <dt className="text-[11px] text-ink-600">{bylineLabel}</dt>
                      <dd className="mt-0.5 font-medium text-ink-800">{byline}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-ink-600">Tanggal terbit</dt>
                      <dd className="mt-0.5 font-medium text-ink-800">
                        {content.publishedAt ? formatDate(content.publishedAt) : 'Baru terbit'}
                      </dd>
                    </div>
                    {content.speaker ? (
                      <div>
                        <dt className="text-[11px] text-ink-600">Penceramah</dt>
                        <dd className="mt-0.5 font-medium text-ink-800">{content.speaker.name}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {content.mediaUrl ? (
                    <div className="mt-5 hidden border-t border-ink-200/80 pt-4 lg:block">
                      <a
                        href={content.mediaUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-800"
                      >
                        <ExternalLink aria-hidden className="size-4 shrink-0" />
                        {MEDIA_ACTION_LABELS[content.type]}
                      </a>
                      {content.type !== 'ARTICLE' ? (
                        <p className="mt-2 text-center text-[11px] text-ink-600">
                          {content.type === 'LINK'
                            ? `${domainFromUrl(content.mediaUrl) ?? 'Sumber eksternal'} · Membuka website lain`
                            : 'Membuka website lain'}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="mt-5 flex items-start gap-2 border-t border-ink-200/80 pt-4 text-[11px] leading-relaxed text-ink-600">
                    <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                    Konten ini melewati peninjauan admin sebelum diterbitkan.
                  </p>
                </div>
              </aside>
            </div>
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function renderVideoMedia(mediaUrl: string, judul: string): JSX.Element | null {
  const embed = getVideoEmbed(mediaUrl);
  if (embed) {
    return <VideoEmbedPlayer embed={embed} title={judul} />;
  }

  if (isDirectVideoFileUrl(mediaUrl)) {
    return (
      <video
        controls
        preload="none"
        className="mt-4 aspect-video w-full rounded-2xl bg-black text-white"
        src={mediaUrl}
        aria-label={judul}
      />
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Tonton video di sumber asli: ${judul}`}
      className="group relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-sea-900 text-white"
    >
      <span aria-hidden className="pattern-islamic absolute inset-0 opacity-50" />
      <span className="relative grid size-16 place-items-center rounded-full bg-white/95 text-sea-900 shadow-lg transition group-hover:scale-105 group-hover:bg-white">
        <Play aria-hidden className="ml-1 size-6 fill-current" />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 text-xs text-white/85">
        Tonton di sumber asli — akan membuka website lain
      </span>
    </a>
  );
}
