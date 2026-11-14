import { BookOpen, Headphones, Link2, ShieldCheck, Video, type LucideIcon } from 'lucide-react';

interface Category {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

const categories: Category[] = [
  {
    title: 'Artikel',
    description:
      'Tulisan ringkas dengan dalil yang jelas, disusun untuk dibaca dalam hitungan menit.',
    icon: BookOpen,
    href: '#artikel',
  },
  {
    title: 'Audio Kajian',
    description: 'Rekaman kajian pilihan yang bisa disimak saat perjalanan atau di sela pekerjaan.',
    icon: Headphones,
    href: '#audio',
  },
  {
    title: 'Video Dakwah',
    description: 'Video pendek yang padat, cocok dibagikan ke keluarga dan kerabat.',
    icon: Video,
    href: '#video',
  },
  {
    title: 'Link Rujukan',
    description: 'Tautan ke sumber terpercaya, dikurasi agar tidak tersesat di lautan informasi.',
    icon: Link2,
    href: '#rujukan',
  },
];

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

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-ink-50/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#atas" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-brand-50">
              <BookOpen aria-hidden className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
          </a>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-6 sm:flex">
            <a href="#kategori" className="text-sm text-ink-600 transition hover:text-brand-700">
              Kategori
            </a>
            <a href="#tentang" className="text-sm text-ink-600 transition hover:text-brand-700">
              Tentang
            </a>
            <a href="/masuk" className="text-sm text-ink-600 transition hover:text-brand-700">
              Masuk
            </a>
            <a
              href="#kategori"
              className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
            >
              Mulai membaca
            </a>
          </nav>

          <div className="flex items-center gap-3 sm:hidden">
            <a href="/masuk" className="text-sm text-ink-600 transition hover:text-brand-700">
              Masuk
            </a>
            <a
              href="#kategori"
              className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
            >
              Mulai
            </a>
          </div>
        </div>
      </header>

      <main id="atas">
        <section className="relative overflow-hidden border-b border-ink-200/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10rem,var(--color-brand-100),transparent)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-800">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Tahap fondasi — konten segera hadir
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-5xl">
              Ilmu yang bermanfaat,
              <span className="block text-brand-700">langkah kecil menuju ridha-Nya.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
              WebDakwah menghimpun artikel, audio kajian, video pendek, dan tautan rujukan dalam
              satu tempat yang tenang — tanpa iklan, tanpa distraksi.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#kategori"
                className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Jelajahi kategori
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
              className="mt-12 font-serif-arabic text-2xl text-brand-800/80 sm:text-3xl"
            >
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
          </div>
        </section>

        <section id="kategori" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Empat pintu menuju ilmu
            </h2>
            <p className="mt-3 text-ink-600">
              Pilih format yang paling cocok dengan waktu dan suasana Anda hari ini.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ title, description, icon: Icon, href }) => (
              <li key={title}>
                <a
                  href={href}
                  className="group flex h-full flex-col rounded-3xl border border-ink-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-ink-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{description}</p>
                  <span className="mt-5 text-xs font-medium text-brand-700">Segera tersedia</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="tentang" className="scroll-mt-20 border-y border-ink-200/70 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WebDakwah. Dibangun untuk kebaikan.</p>
          <p className="text-xs text-ink-400">Fase 2 — autentikasi &amp; hak akses</p>
        </div>
      </footer>
    </div>
  );
}
