import type { ReactNode } from 'react';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

/**
 * Kerangka halaman informasi statis (tentang, kontak, privasi, syarat).
 * Server Component tanpa data dinamis; hanya header/footer publik yang dipakai
 * ulang agar tampilan tetap konsisten dengan halaman baca.
 */
export function InfoPage({ eyebrow, title, intro, children }: InfoPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-soft">
      <SiteHeader />

      <main className="flex-1">
        <div className="border-b border-ink-200/70 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              {intro}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <article className="space-y-8 text-sm leading-relaxed text-ink-700 sm:text-[15px]">
            {children}
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Penanda bahwa teks kebijakan masih kerangka dan belum ditinjau pihak
 * berwenang. Tampil selama `legalReviewedAt` kosong di `lib/site.ts`.
 */
export function LegalDraftNotice({ reviewedAt }: { reviewedAt: string | null }) {
  if (reviewedAt) {
    return (
      <p className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-xs leading-relaxed text-ink-600">
        Terakhir ditinjau: <time dateTime={reviewedAt}>{reviewedAt}</time>.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
      <strong className="font-semibold">Draf.</strong> Teks ini adalah kerangka yang disusun dari
      perilaku aplikasi saat ini dan <strong>belum ditinjau pihak yang berwenang</strong>. Jangan
      dianggap sebagai nasihat hukum. Pemilik situs wajib meninjau dan melengkapinya sebelum
      dipublikasikan.
    </div>
  );
}
