import type { PublicContentSummary, PublicHighlights, PublicLatest } from '@webdakwah/shared';
import { ArrowRight, BookOpen, Search, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
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
import {
  CONTENT_SECTIONS,
  CONTENT_TYPE_ORDER,
  contentPath,
  sectionPath,
} from '@/lib/content-routes';
import { CONTENT_TYPE_VISUALS } from '@/lib/content-visuals';
import { formatDate } from '@/lib/format';
import { HERO_AYAT, HERO_IMAGE, isHeroAyatComplete, type HeroAyat } from '@/lib/hero';

export const revalidate = 60;

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

/** Kartu ayat hero; hanya dirender bila konfigurasi lengkap. */
function HeroAyatCard({ ayat, className = '' }: { ayat: HeroAyat; className?: string }) {
  return (
    <figure
      className={`rounded-3xl border border-ink-200 bg-white p-5 text-left shadow-soft sm:p-6 ${className}`}
    >
      <blockquote>
        <p
          dir="rtl"
          lang="ar"
          className="font-serif-arabic text-xl leading-loose text-ink-900 sm:text-2xl"
        >
          {ayat.arab}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{ayat.terjemahan}</p>
      </blockquote>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-100 pt-3 text-xs text-ink-500">
        <span className="font-semibold text-ink-800">{ayat.sumber}</span>
        <span aria-hidden>·</span>
        <span>
          Diperiksa {ayat.verifiedBy} pada {ayat.verifiedAt}
        </span>
      </figcaption>
    </figure>
  );
}

/** Panel visual kolom kanan: foto, ayat, atau konten terbaru di atas pola. */
function HeroPanel({ items }: { items: PublicContentSummary[] }) {
  const ayat = isHeroAyatComplete(HERO_AYAT) ? HERO_AYAT : null;

  if (HERO_IMAGE) {
    return (
      <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
        <div className="relative overflow-hidden rounded-[2rem] border border-ink-200 bg-brand-950">
          <Image
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            width={HERO_IMAGE.width}
            height={HERO_IMAGE.height}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-[16/10] w-full object-cover lg:aspect-[4/5] lg:max-h-[520px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/75 via-brand-950/10 to-transparent"
          />
        </div>

        {ayat ? (
          <HeroAyatCard ayat={ayat} className="relative z-10 mx-4 -mt-16 sm:mx-6 lg:-mt-20" />
        ) : null}

        {HERO_IMAGE.credit ? (
          <p className="mt-2 text-right text-[11px] text-ink-500">{HERO_IMAGE.credit}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pattern-islamic relative mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-brand-900/40 bg-brand-950 p-3 shadow-panel sm:p-4 lg:max-w-none">
      <div className="relative rounded-[1.6rem] bg-surface-soft p-5 sm:p-6">
        {ayat ? (
          <HeroAyatCard ayat={ayat} className="border-0 bg-transparent p-0 shadow-none" />
        ) : items.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-brand-700 uppercase">
                Terbaru
              </p>
              <Link
                href="/cari"
                className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-900"
              >
                Semua kajian
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
            <ul className="mt-2 divide-y divide-ink-200/70">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={contentPath(item.type, item.slug)}
                    className="group block py-3.5 transition"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
                      {CONTENT_TYPE_VISUALS[item.type].label}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-snug font-semibold text-ink-900 transition group-hover:text-brand-700">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-ink-500">
                      {item.publishedAt ? formatDate(item.publishedAt) : 'Baru terbit'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="py-8 text-center">
            <BookOpen aria-hidden className="mx-auto size-6 text-brand-700" />
            <p className="mt-3 text-sm font-medium text-ink-900">Belum ada kajian terbit.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-500">
              Materi yang sudah ditinjau admin akan tampil di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
        {/* Hero: satu bidang editorial terpusat. */}
        <section className="border-b border-ink-200/80 bg-surface-soft">
          <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
            <div className="grid items-center gap-8 pt-8 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-12">
              <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
                <p className="flex items-center justify-center gap-2.5 text-[11px] font-semibold tracking-[0.18em] text-brand-700 uppercase lg:justify-start">
                  <span aria-hidden className="h-px w-6 bg-accent-500" />
                  Kajian Islam terkurasi
                </p>

                <h1 className="mt-4 max-w-[22ch] text-[2.05rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-ink-950 sm:text-[2.6rem] lg:text-5xl">
                  Temukan kajian yang menenangkan hati.
                </h1>

                <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-600 sm:text-base lg:mx-0">
                  Ruang tenang untuk membaca, menyimak, dan menonton kajian Islam. Setiap materi
                  diperiksa admin sebelum terbit, tanpa iklan dan tanpa distraksi.
                </p>

                <form
                  action="/cari"
                  role="search"
                  className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-soft transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100 lg:mx-0 lg:max-w-none"
                >
                  <Search aria-hidden className="ml-2 size-4 shrink-0 text-ink-400" />
                  <label htmlFor="beranda-cari" className="sr-only">
                    Cari kajian, ustadz, atau topik
                  </label>
                  <input
                    id="beranda-cari"
                    type="search"
                    name="q"
                    placeholder="Cari judul, ustadz, atau topik"
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none sm:text-base"
                  />
                  <button
                    type="submit"
                    className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-800"
                  >
                    Cari
                    <ArrowRight aria-hidden className="size-4" />
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm lg:justify-start">
                  <a
                    href="#terbaru"
                    className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-ink-700 transition hover:text-brand-800"
                  >
                    Lihat kajian terbaru
                    <ArrowRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </a>
                  <Link
                    href="/cari"
                    className="inline-flex min-h-11 items-center font-medium text-ink-500 transition hover:text-brand-800"
                  >
                    Telusuri seluruh arsip
                  </Link>
                </div>
              </div>

              <div className="w-full">
                <HeroPanel items={latestItems.slice(0, 2)} />
              </div>
            </div>
          </div>

          {/* Compact navigation strip empat format di bawah hero. */}
          <nav aria-label="Empat format kajian" className="border-t border-ink-200/80 bg-surface">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-3 border-b border-ink-200/70 pb-4 sm:pb-5">
                {CONTENT_TYPE_ORDER.map((type, index) => {
                  const section = CONTENT_SECTIONS[type];
                  const Icon = CONTENT_TYPE_VISUALS[type].icon;

                  return (
                    <Link
                      key={type}
                      href={sectionPath(type)}
                      className="group flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 transition hover:bg-white hover:shadow-soft sm:px-5"
                    >
                      <span className="font-display text-xs text-ink-400">0{index + 1}</span>
                      <Icon
                        aria-hidden
                        className="size-4 text-ink-600 transition group-hover:text-brand-700"
                      />
                      <span className="max-w-[8rem] text-[13px] font-medium text-ink-700 transition group-hover:text-brand-800">
                        {section.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </section>

        <section className="relative overflow-hidden bg-brand-950 py-14 sm:py-16 lg:py-20">
          <div
            aria-hidden
            className="pattern-islamic pointer-events-none absolute inset-0 opacity-30"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/3 size-[30rem] rounded-full bg-brand-700/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-accent-400 uppercase">
                  Sorotan
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Satu kajian untuk menemani waktu Anda
                </h2>
              </div>
              <Link
                href="/cari"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-white/65 transition hover:text-accent-300"
              >
                Telusuri semua
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            {featured ? (
              <FeaturedContentCard item={featured} />
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-accent-300">
                  <BookOpen aria-hidden className="size-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-white">Belum ada kajian terbit.</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-white/55">
                  Kajian yang sudah ditinjau admin akan tampil di sini sebagai sorotan utama.
                </p>
                <Link
                  href="/cari"
                  className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Telusuri empat format
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Empat pintu */}
        <section
          id="kategori"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-brand-600 uppercase">
              Mulai dari sini
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Empat pintu menuju ilmu
            </h2>
            <p className="mt-3 text-ink-600">
              Pilih format yang paling cocok dengan waktu dan suasana Anda hari ini.
            </p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTENT_TYPE_ORDER.map((type) => {
              const section = CONTENT_SECTIONS[type];
              const visual = CONTENT_TYPE_VISUALS[type];
              const Icon = visual.icon;
              const item = highlights?.[type] ?? null;

              return (
                <li key={type}>
                  <Link
                    href={sectionPath(type)}
                    className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200/80 bg-white p-5 shadow-soft hover:border-brand-200"
                  >
                    <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${visual.accent}`} />
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`grid size-11 place-items-center rounded-2xl ${visual.iconWrap}`}
                      >
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <span className="text-[10px] text-ink-400">
                        0{CONTENT_TYPE_ORDER.indexOf(type) + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-ink-900">{section.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">
                      {section.description}
                    </p>

                    <div className="mt-5 border-t border-ink-100 pt-4">
                      <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
                        Terbaru
                      </p>
                      {item ? (
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium text-ink-800 transition group-hover:text-brand-700">
                          {item.title}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-ink-600">Belum ada konten terbit</p>
                      )}
                    </div>

                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-brand-700">
                      Lihat semua
                      <ArrowRight
                        aria-hidden
                        className="size-3.5 transition group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Terbaru */}
        <section id="terbaru" className="scroll-mt-24 border-y border-ink-200/70 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-brand-600 uppercase">
                  Baru terbit
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Terbaru
                </h2>
                <p className="mt-3 max-w-2xl text-ink-600">
                  Kajian yang baru saja ditinjau dan diterbitkan.
                </p>
              </div>
              <Link
                href="/cari"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
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

        {/* Topik */}
        {topics.length > 0 ? (
          <section className="bg-surface-soft">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-brand-600 uppercase">
                  Telusuri
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Topik yang sering dicari
                </h2>
                <p className="mt-3 text-ink-600">
                  Mulai dari tema yang dekat dengan keseharian jamaah.
                </p>
              </div>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <li key={`${topic.kind}-${topic.slug}`}>
                    <Link
                      href={topic.href}
                      className="group flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-ink-200/80 bg-white px-4 py-3.5 transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                          {topic.kind}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-ink-900 group-hover:text-brand-800">
                          {topic.name}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="size-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Prinsip */}
        <section id="tentang" className="scroll-mt-24 border-t border-ink-200/70 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
                  <ShieldCheck aria-hidden className="size-3.5" />
                  Dikurasi &amp; ditinjau
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Prinsip yang kami pegang
                </h2>
                <p className="mt-3 max-w-md text-ink-600">
                  Dakwah bukan soal banyaknya konten, tetapi soal tepatnya isi. Karena itu setiap
                  materi melewati pemeriksaan sebelum dipublikasikan.
                </p>
                <Link
                  href="/cari"
                  className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
                >
                  Mulai telusuri kajian
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>

              <ul className="grid gap-0 sm:grid-cols-1">
                {pillars.map(({ title, description }, index) => (
                  <li
                    key={title}
                    className="grid gap-3 border-t border-ink-200/80 py-6 first:border-t-0 first:pt-0 sm:grid-cols-[auto_1fr] sm:gap-6 sm:py-7"
                  >
                    <span className="font-display text-2xl leading-none text-accent-600 sm:text-3xl">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA penutup */}
        <section className="relative overflow-hidden bg-brand-900">
          <div aria-hidden className="pattern-islamic absolute inset-0 opacity-40" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-accent-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-accent-300 uppercase">
              Langkah kecil hari ini
            </p>
            <h2 className="mt-3 text-2xl leading-tight font-bold tracking-tight text-white text-balance sm:text-4xl">
              Mulai dari satu kajian, lalu jaga ritmenya.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Simpan kajian yang ingin Anda dalami, lalu kembali saat waktu luang. Tidak perlu
              terburu-buru.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/cari"
                className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
              >
                Jelajah konten
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href="/simpanan"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Buka simpanan
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
