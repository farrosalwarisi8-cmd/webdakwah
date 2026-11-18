'use client';

import type { ContentType, PublicContentSummary } from '@webdakwah/shared';
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
        <div className="mt-5 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-ink-800">Belum ada kajian di bagian ini.</p>
          <p className="mt-1 text-sm text-ink-600">
            Konten yang sudah ditinjau akan tampil di sini.
          </p>
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
