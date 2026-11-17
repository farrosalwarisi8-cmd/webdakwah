'use client';

import { Node } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

export const QUOTE_BLOCK_KINDS = ['AYAH', 'HADITH'] as const;

export type QuoteBlockKind = (typeof QUOTE_BLOCK_KINDS)[number];

export const QUOTE_BLOCK_LABELS: Record<QuoteBlockKind, string> = {
  AYAH: 'Ayat',
  HADITH: 'Hadis',
};

function normalizeKind(value: unknown): QuoteBlockKind {
  return value === 'HADITH' ? 'HADITH' : 'AYAH';
}

function QuoteBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const kind = normalizeKind(node.attrs.kind);
  const reference = String(node.attrs.reference ?? '');
  const arabic = String(node.attrs.arabic ?? '');
  const translation = String(node.attrs.translation ?? '');

  return (
    <NodeViewWrapper
      data-quote-block
      data-kind={kind}
      className={`my-4 rounded-2xl border bg-white p-3 transition ${
        selected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-ink-200'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-drag-handle
          aria-label="Geser blok"
          className="cursor-grab rounded-lg px-1.5 py-1 text-xs text-ink-400 hover:bg-ink-100"
        >
          ⠿
        </button>
        <select
          aria-label="Jenis kutipan"
          value={kind}
          onChange={(event) => updateAttributes({ kind: event.target.value })}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 outline-none focus:border-brand-500"
        >
          {QUOTE_BLOCK_KINDS.map((value) => (
            <option key={value} value={value}>
              {QUOTE_BLOCK_LABELS[value]}
            </option>
          ))}
        </select>
        <input
          aria-label="Sumber kutipan"
          value={reference}
          onChange={(event) => updateAttributes({ reference: event.target.value })}
          placeholder={kind === 'HADITH' ? 'HR. Bukhari no. 1' : 'QS. Al-Baqarah: 2'}
          className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-800 outline-none focus:border-brand-500"
        />
        <button
          type="button"
          onClick={deleteNode}
          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Hapus
        </button>
      </div>

      <textarea
        aria-label="Teks Arab"
        value={arabic}
        onChange={(event) => updateAttributes({ arabic: event.target.value })}
        dir="rtl"
        lang="ar"
        rows={2}
        placeholder="Teks Arab…"
        className="font-serif-arabic mt-2 w-full resize-y rounded-lg border border-ink-200 px-2 py-1.5 text-lg leading-loose text-ink-900 outline-none focus:border-brand-500"
      />

      <textarea
        aria-label="Terjemahan"
        value={translation}
        onChange={(event) => updateAttributes({ translation: event.target.value })}
        rows={2}
        placeholder="Terjemahan atau penjelasan singkat…"
        className="mt-2 w-full resize-y rounded-lg border border-ink-200 px-2 py-1.5 text-xs leading-relaxed text-ink-700 outline-none focus:border-brand-500"
      />
    </NodeViewWrapper>
  );
}

/**
 * Blok kutipan Ayat/Hadis: sumber, teks Arab (RTL), dan terjemahan.
 * Disimpan sebagai HTML agar ikut sanitizer dan tampil sama di halaman publik.
 */
export const QuoteBlock = Node.create({
  name: 'quoteBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      kind: { default: 'AYAH' },
      reference: { default: '' },
      arabic: { default: '' },
      translation: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-quote-block]',
        getAttrs: (element) => {
          const source = (element as HTMLElement).querySelector('.quote-source')?.textContent ?? '';
          const reference = source.replace(/^(Ayat|Hadis)\s*(·\s*)?/u, '').trim();

          return {
            kind: (element as HTMLElement).getAttribute('data-kind'),
            reference,
            arabic:
              (element as HTMLElement).querySelector('.quote-arabic')?.textContent?.trim() ?? '',
            translation:
              (element as HTMLElement).querySelector('.quote-translation')?.textContent?.trim() ??
              '',
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const kind = normalizeKind(node.attrs.kind);
    const reference = String(node.attrs.reference ?? '').trim();
    const arabic = String(node.attrs.arabic ?? '').trim();
    const translation = String(node.attrs.translation ?? '').trim();
    const source = reference
      ? `${QUOTE_BLOCK_LABELS[kind]} · ${reference}`
      : QUOTE_BLOCK_LABELS[kind];
    const content: DOMOutputSpec[] = [];

    content.push(['p', { class: 'quote-source' }, source]);

    if (arabic) {
      content.push(['p', { class: 'quote-arabic', dir: 'rtl', lang: 'ar' }, arabic]);
    }

    if (translation) {
      content.push(['p', { class: 'quote-translation' }, translation]);
    }

    return ['div', { 'data-quote-block': '', 'data-kind': kind, class: 'quote-block' }, ...content];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteBlockView);
  },
});
