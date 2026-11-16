import type { ContentType, PublicHighlights } from '@webdakwah/shared';
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

import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { PublicApiError, getHomeHighlights } from '@/lib/api/public';
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

export default async function HomePage() {
  let highlights: PublicHighlights | null = null;

  try {
    highlights = await getHomeHighlights();
  } catch (error) {
    if (!(error instanceof PublicApiError)) {
      throw error;
    }
  }

  return (
    <div className="min-h-dvh bg-surface-soft">
      <SiteHeader />

      <main id="atas">
        <section className="relative overflow-hidden border-b border-ink-200/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10rem,var(--color-accent-100),transparent)]"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-800">
              <span className="size-1.5 rounded-full bg-accent-500" />
              Dikurasi &amp; ditinjau sebelum terbit
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-5xl">
              Ilmu yang bermanfaat,
              <span className="block text-brand-700">langkah kecil menuju ridha-Nya.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
              WebDakwah menghimpun artikel, audio kajian, video pendek, dan tautan rujukan dalam
              satu tempat yang tenang — tanpa iklan, tanpa distraksi.
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
                className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Cari
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href="#kategori"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-400"
              >
                Mulai menjelajah
              </a>
              <a
                href="#tentang"
                className="inline-flex items-center justify-center rounded-full border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
              >
                Kenapa WebDakwah?
              </a>
            </div>

            <p
              dir="rtl"
              lang="ar"
              className="mt-12 font-serif-arabic text-2xl leading-loose text-brand-800/80 sm:text-3xl"
            >
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
          </div>
        </section>

        <section id="kategori" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Empat pintu menuju ilmu
            </h2>
            <p className="mt-3 text-ink-600">
              Pilih format yang paling cocok dengan waktu dan suasana Anda hari ini.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTENT_TYPE_ORDER.map((type) => {
              const section = CONTENT_SECTIONS[type];
              const Icon = categoryIcons[type];
              const latest = highlights?.[type] ?? null;

              return (
                <li key={type}>
                  <Link
                    href={sectionPath(type)}
                    className="group flex h-full flex-col rounded-3xl border border-ink-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-accent-100 text-accent-700 transition group-hover:bg-accent-200">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-ink-900">{section.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {section.description}
                    </p>

                    <div className="mt-5 border-t border-ink-100 pt-4">
                      {latest ? (
                        <>
                          <p className="text-xs text-ink-500">Terbaru</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium text-ink-800 transition group-hover:text-brand-700">
                            {latest.title}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-ink-500">Belum ada konten terbit</p>
                      )}
                    </div>

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      Lihat semua
                      <ArrowRight aria-hidden className="size-3.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="tentang" className="scroll-mt-24 border-y border-ink-200/70 bg-white/60">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
                  <ShieldCheck aria-hidden className="size-3.5" />
                  Dikurasi &amp; ditinjau
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                  Prinsip yang kami pegang
                </h2>
                <p className="mt-3 text-ink-600">
                  Dakwah bukan soal banyaknya konten, tetapi soal tepatnya isi. Karena itu setiap
                  materi melewati pemeriksaan sebelum dipublikasikan.
                </p>
              </div>

              <ul className="space-y-4">
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
