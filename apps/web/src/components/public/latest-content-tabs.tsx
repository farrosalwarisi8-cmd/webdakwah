'use client';

import type { ContentType, PublicContentSummary } from '@webdakwah/shared';
import { Compass } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PublicContentCard } from './content-card';

const TABS: { value: ContentType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'ARTICLE', label: 'Artikel' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'LINK', label: 'Rujukan' },
];

export function LatestContentTabs({ items }: { items: PublicContentSummary[] }) {
  const [active, setActive] = useState<ContentType | 'ALL'>('ALL');
  const visible = active === 'ALL' ? items : items.filter((item) => item.type === active);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter konten terbaru"
        className="hide-scrollbar flex gap-2 overflow-x-auto pb-1"
      >
        {TABS.map((tab) => {
          const selected = active === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.value)}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'bg-brand-900 text-white shadow-soft'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center sm:p-10">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-surface-soft text-ink-500">
            <Compass aria-hidden className="size-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-800">
            {active === 'ALL' ? 'Belum ada kajian terbit.' : 'Belum ada kajian berjenis ini.'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-600">
            {active === 'ALL'
              ? 'Kajian yang sudah ditinjau admin akan tampil di sini.'
              : 'Coba tab lain, atau telusuri seluruh koleksi kami.'}
          </p>
          <Link
            href="/cari"
            className="btn-press mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-900 px-4 text-xs font-semibold text-white transition hover:bg-brand-800"
          >
            Telusuri koleksi
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <PublicContentCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
