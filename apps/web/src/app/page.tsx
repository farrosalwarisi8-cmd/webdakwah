import type {
  ContentType,
  PublicHighlights,
  PublicLatest,
  PublicContentSummary,
} from '@webdakwah/shared';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Link2,
  Search,
  ShieldCheck,
  Video,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { FeaturedContentCard } from '@/components/public/featured-content-card';
import { LatestContentTabs } from '@/components/public/latest-content-tabs';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import {
  PublicApiError,
  getHomeHighlights,
  getLatestContent,
  getPublicCategories,
  getPublicTags,
} from '@/lib/api/public';
import { CONTENT_SECTIONS, CONTENT_TYPE_ORDER, sectionPath } from '@/lib/content-routes';

export const revalidate = 60;

const categoryIcons: Record<ContentType, LucideIcon> = {
  ARTICLE: BookOpen,
  AUDIO: Headphones,
  VIDEO: Video,
  LINK: Link2,
};

const pillars = [
  {
    title: 'Ditulis manusia, ditinjau manusia',
    description:
      'Setiap tulisan melewati proses review oleh admin sebelum terbit. Tidak ada konten yang lolos tanpa pemeriksaan.',
  },
  {
    title: 'Ringan di jaringan lambat',
    description:
      'Halaman dibuat seringkas mungkin dan dioptimalkan untuk ponsel, supaya tetap nyaman dibuka dengan kuota terbatas.',
  },
  {
    title: 'Rujukan yang bisa diperiksa',
    description:
      'Narasumber dan tautan asli selalu dicantumkan, agar pembaca bisa memverifikasi sendiri isi kajian.',
  },
];

type TaxonomyItem = { name: string; slug: string };

export default async function HomePage() {
  let highlights: PublicHighlights | null = null;
  let latest: PublicLatest | null = null;
  let categories: TaxonomyItem[] = [];
  let tags: TaxonomyItem[] = [];

  const [highlightsResult, latestResult, categoriesResult, tagsResult] = await Promise.allSettled([
    getHomeHighlights(),
    getLatestContent(9),
    getPublicCategories(),
    getPublicTags(),
  ]);

  if (highlightsResult.status === 'fulfilled') {
    highlights = highlightsResult.value;
  } else if (!(highlightsResult.reason instanceof PublicApiError)) {
    throw highlightsResult.reason;
  }

  if (latestResult.status === 'fulfilled') {
    latest = latestResult.value;
  }

  if (categoriesResult.status === 'fulfilled') {
    categories = categoriesResult.value;
  }

  if (tagsResult.status === 'fulfilled') {
    tags = tagsResult.value;
  }

  const latestItems = latest?.items ?? [];
  const featured: PublicContentSummary | null =
    latestItems[0] ??
    highlights?.ARTICLE ??
    highlights?.AUDIO ??
    highlights?.VIDEO ??
    highlights?.LINK ??
    null;

  const topics = [
    ...categories.slice(0, 4).map((item) => ({
      ...item,
      href: `/kategori/${encodeURIComponent(item.slug)}`,
      kind: 'Kategori',
    })),
    ...tags.slice(0, 6).map((item) => ({
      ...item,
      href: `/tag/${encodeURIComponent(item.slug)}`,
      kind: 'Topik',
    })),
  ];

  return (
    <div className="min-h-dvh bg-surface-soft">
      <SiteHeader />

      <main id="atas">
        <section className="relative overflow-hidden border-b border-ink-200/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_20%_-10rem,var(--color-accent-100),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-800">
                <span className="size-1.5 rounded-full bg-accent-500" />
                Dikurasi &amp; ditinjau sebelum terbit
              </span>

              <h1 className="mt-6 max-w-3xl text-[2rem] leading-[1.15] font-bold tracking-tight text-ink-900 sm:text-5xl">
                Temukan kajian yang
                <span className="block text-brand-700">menenangkan hati.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
                Artikel, audio kajian, video pendek, dan tautan rujukan dalam satu tempat yang
                tenang — tanpa iklan, tanpa distraksi.
              </p>

              <form
                action="/cari"
                role="search"
                className="mt-8 flex max-w-xl items-center gap-1.5 rounded-2xl border border-ink-200 bg-white p-2 shadow-[0_8px_24px_rgba(23,59,50,0.08)]"
              >
                <Search aria-hidden className="ml-2 size-4 shrink-0 text-ink-400" />
                <label htmlFor="beranda-cari" className="sr-only">
                  Cari kajian, ustadz, atau topik
                </label>
                <input
                  id="beranda-cari"
                  type="search"
                  name="q"
                  placeholder="Cari kajian, ustadz, atau topik"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Cari
                </button>
              </form>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#terbaru"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
                >
                  Lihat kajian terbaru
                </a>
                <a
                  href="#tentang"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Kenapa WebDakwah?
                </a>
              </div>

              <p
                dir="rtl"
                lang="ar"
                className="mt-10 font-serif-arabic text-2xl leading-loose text-brand-800/80 sm:text-3xl"
              >
                وَقُل رَّبِّ زِدْنِي عِلْمًا
              </p>
            </div>

            <div className="lg:pl-4">
              {featured ? (
                <FeaturedContentCard item={featured} />
              ) : (
                <div className="rounded-3xl border border-ink-200 bg-white p-8">
                  <p className="text-sm font-medium text-ink-800">Belum ada kajian terbit.</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Kajian yang sudah ditinjau admin akan tampil di sini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="kategori"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Empat pintu menuju ilmu
            </h2>
            <p className="mt-3 text-ink-600">
              Pilih format yang paling cocok dengan waktu dan suasana Anda hari ini.
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONTENT_TYPE_ORDER.map((type) => {
              const section = CONTENT_SECTIONS[type];
              const Icon = categoryIcons[type];
              const item = highlights?.[type] ?? null;

              return (
                <li key={type}>
                  <Link
                    href={sectionPath(type)}
                    className="group flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_8px_24px_rgba(23,59,50,0.04)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_8px_24px_rgba(23,59,50,0.08)]"
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-accent-100 text-accent-700 transition group-hover:bg-accent-200">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-ink-900">{section.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">
                      {section.description}
                    </p>

                    <div className="mt-4 border-t border-ink-100 pt-3">
                      {item ? (
                        <p className="line-clamp-2 text-sm font-medium text-ink-800 transition group-hover:text-brand-700">
                          {item.title}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-500">Belum ada konten terbit</p>
                      )}
                    </div>

                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                      Lihat semua
                      <ArrowRight aria-hidden className="size-3.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="terbaru" className="scroll-mt-24 border-y border-ink-200/70 bg-white/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Terbaru
                </h2>
                <p className="mt-3 max-w-2xl text-ink-600">
                  Kajian yang baru saja ditinjau dan diterbitkan.
                </p>
              </div>
              <Link
                href="/cari"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Jelajah semua
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            <div className="mt-7">
              <LatestContentTabs items={latestItems} />
            </div>
          </div>
        </section>

        {topics.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                Topik populer
              </h2>
              <p className="mt-3 text-ink-600">Mulai dari tema yang sering dicari jamaah.</p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <li key={`${topic.kind}-${topic.slug}`}>
                  <Link
                    href={topic.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
                  >
                    {topic.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="tentang" className="scroll-mt-24 border-t border-ink-200/70 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                  <ShieldCheck aria-hidden className="size-3.5" />
                  Dikurasi &amp; ditinjau
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Prinsip yang kami pegang
                </h2>
                <p className="mt-3 text-ink-600">
                  Dakwah bukan soal banyaknya konten, tetapi soal tepatnya isi. Karena itu setiap
                  materi melewati pemeriksaan sebelum dipublikasikan.
                </p>
              </div>

              <ul className="space-y-3">
                {pillars.map(({ title, description }) => (
                  <li key={title} className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
                    <h3 className="text-base font-semibold text-ink-900">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
