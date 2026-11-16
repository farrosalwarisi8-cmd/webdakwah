'use client';

import {
  CONTENT_LINK_TYPES,
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  type ContentType,
} from '@webdakwah/shared';
import { useActionState, useState } from 'react';

import type { ContentFormState } from './form-state';
import { MediaUploadField } from './media-upload-field';

interface TaxonomyOption {
  id: string;
  name: string;
}

interface ContentFormProps {
  action: (state: ContentFormState, formData: FormData) => Promise<ContentFormState>;
  contentId?: string;
  initial?: {
    type: ContentType;
    title: string;
    excerpt: string;
    body: string;
    mediaUrl: string;
    categoryIds?: string[];
    tagNames?: string[];
    speakerId?: string | null;
    links?: { title: string; url: string }[];
  };
  taxonomy?: {
    categories: TaxonomyOption[];
    speakers: TaxonomyOption[];
  };
  submitLabel: string;
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const labelClass = 'text-sm font-medium text-ink-800';

export function ContentForm({
  action,
  contentId,
  initial,
  taxonomy,
  submitLabel,
}: ContentFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [type, setType] = useState<ContentType>(initial?.type ?? 'ARTICLE');
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? '');
  const [links, setLinks] = useState<{ title: string; url: string }[]>(initial?.links ?? []);

  const needsMedia = type !== 'ARTICLE';
  const supportsLinks = (CONTENT_LINK_TYPES as readonly string[]).includes(type);

  function addLink() {
    if (links.length >= 10) return;
    setLinks((prev) => [...prev, { title: '', url: '' }]);
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: 'title' | 'url', value: string) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target] as { title: string; url: string };
      next[target] = temp as { title: string; url: string };
      return next;
    });
  }

  return (
    <form action={formAction} className="mt-6 space-y-5">
      {contentId ? <input type="hidden" name="id" value={contentId} /> : null}

      <div>
        <label htmlFor="type" className={labelClass}>
          Jenis konten
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as ContentType)}
          className={fieldClass}
        >
          {CONTENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {CONTENT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Judul
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={200}
          defaultValue={initial?.title ?? ''}
          className={fieldClass}
          placeholder="Contoh: Adab Menuntut Ilmu"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className={labelClass}>
          Ringkasan <span className="font-normal text-ink-500">(opsional)</span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={initial?.excerpt ?? ''}
          className={fieldClass}
          placeholder="Dua kalimat yang muncul di daftar konten."
        />
      </div>

      <div>
        <label className={labelClass}>
          Kategori <span className="font-normal text-ink-500">(maksimal 5; wajib saat ajukan review)</span>
        </label>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {(taxonomy?.categories ?? []).map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm text-ink-800">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={initial?.categoryIds?.includes(category.id)}
                className="rounded border-ink-300 text-brand-700 focus:ring-brand-500"
              />
              {category.name}
            </label>
          ))}
          {(taxonomy?.categories ?? []).length === 0 ? (
            <p className="text-xs text-ink-500">Belum ada kategori. Admin perlu menambahkannya.</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="tagNames" className={labelClass}>
          Tag <span className="font-normal text-ink-500">(maksimal 10, pisahkan dengan koma)</span>
        </label>
        <input
          id="tagNames"
          name="tagNames"
          defaultValue={initial?.tagNames?.join(', ') ?? ''}
          className={fieldClass}
          placeholder="adab, ilmu, akhlak"
        />
      </div>

      <div>
        <label htmlFor="speakerId" className={labelClass}>
          Penceramah <span className="font-normal text-ink-500">(opsional)</span>
        </label>
        <select
          id="speakerId"
          name="speakerId"
          defaultValue={initial?.speakerId ?? ''}
          className={fieldClass}
        >
          <option value="">— Tidak ada —</option>
          {(taxonomy?.speakers ?? []).map((speaker) => (
            <option key={speaker.id} value={speaker.id}>
              {speaker.name}
            </option>
          ))}
        </select>
      </div>

      {needsMedia ? (
        <div>
          <label htmlFor="mediaUrl" className={labelClass}>
            Tautan media
          </label>
          <input
            id="mediaUrl"
            name="mediaUrl"
            type="url"
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.target.value)}
            className={fieldClass}
            placeholder="https://contoh.com/kajian.mp3"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Wajib untuk audio, video, dan tautan rujukan. Hanya alamat http/https.
            {type === 'LINK' ? null : ' Anda bisa mengunggah berkas di bawah agar tautan terisi.'}
          </p>

          {type === 'AUDIO' || type === 'VIDEO' ? (
            <MediaUploadField type={type} value={mediaUrl} onChange={setMediaUrl} />
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="mediaUrl" value="" />
      )}

      <div>
        <label htmlFor="body" className={labelClass}>
          {type === 'ARTICLE' ? 'Isi artikel' : 'Deskripsi'}
          {type === 'ARTICLE' ? null : (
            <span className="font-normal text-ink-500"> (opsional)</span>
          )}
        </label>
        <textarea
          id="body"
          name="body"
          rows={type === 'ARTICLE' ? 14 : 6}
          maxLength={50000}
          defaultValue={initial?.body ?? ''}
          className={fieldClass}
          placeholder={
            type === 'ARTICLE'
              ? 'Tulis artikel di sini. Gunakan baris kosong untuk memisahkan paragraf.'
              : 'Keterangan singkat tentang media ini.'
          }
        />
        <p className="mt-1.5 text-xs text-ink-500">
          Anda tetap bisa menyimpan sebagai draft meski isian belum lengkap. Kelengkapan diperiksa
          saat mengajukan review.
        </p>
      </div>

      {supportsLinks ? (
        <div>
          <label className={labelClass}>
            Tautan Terkait{' '}
            <span className="font-normal text-ink-500">(maksimal 10, opsional)</span>
          </label>
          <div className="mt-1.5 space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-3 sm:flex-row sm:items-center">
                <input
                  aria-label="Judul tautan"
                  name="linkTitle"
                  value={link.title}
                  onChange={(event) => updateLink(index, 'title', event.target.value)}
                  className={fieldClass}
                  placeholder="Judul tautan"
                />
                <input
                  aria-label="URL tautan"
                  name="linkUrl"
                  type="url"
                  value={link.url}
                  onChange={(event) => updateLink(index, 'url', event.target.value)}
                  className={fieldClass}
                  placeholder="https://contoh.com"
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveLink(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-600 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(index, 1)}
                    disabled={index === links.length - 1}
                    className="rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-600 disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            disabled={links.length >= 10}
            className="mt-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tambah tautan
          </button>
          {links.length === 0 ? (
            <p className="mt-1.5 text-xs text-ink-500">Belum ada tautan terkait.</p>
          ) : null}
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : submitLabel}
        </button>
        <span className="text-xs text-ink-500">Konten tersimpan sebagai draft.</span>
      </div>
    </form>
  );
}
