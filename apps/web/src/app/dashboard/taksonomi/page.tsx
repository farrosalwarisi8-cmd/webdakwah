import {
  can,
  categoryManageSchema,
  speakerManageSchema,
  tagManageSchema,
  type CategoryManage,
  type SpeakerManage,
  type TagManage,
} from '@webdakwah/shared';
import type { Metadata } from 'next';

import { ConfirmButton } from '@/components/confirm-button';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import {
  cleanupOrphanTagsAction,
  createCategoryAction,
  createSpeakerAction,
  deleteCategoryAction,
  deleteSpeakerAction,
  deleteTagAction,
  mergeTagAction,
  renameCategoryAction,
  renameTagAction,
  updateSpeakerAction,
} from './actions';

export const metadata: Metadata = {
  title: 'Kelola taksonomi',
  robots: { index: false, follow: false },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  'kategori-ditambah': 'Kategori berhasil ditambahkan.',
  'kategori-diubah': 'Nama kategori berhasil diubah.',
  'kategori-dihapus': 'Kategori berhasil dihapus.',
  'penceramah-ditambah': 'Penceramah berhasil ditambahkan.',
  'penceramah-diubah': 'Data penceramah berhasil diperbarui.',
  'penceramah-dihapus': 'Penceramah berhasil dihapus.',
  'tag-diubah': 'Nama tag berhasil diubah.',
  'tag-digabung': 'Tag berhasil digabungkan.',
  'tag-dihapus': 'Tag berhasil dihapus.',
  'tag-yatim': 'Tag yatim dibersihkan.',
};

const fieldClass =
  'mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const primaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800';

const secondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700';

const dangerButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function countLabel(item: { publishedCount: number; totalCount: number }): string {
  return `${item.publishedCount} terbit · ${item.totalCount} total`;
}

function deleteMessage(
  label: string,
  item: { publishedCount: number; totalCount: number },
): string {
  if (item.totalCount === 0) {
    return `Hapus ${label}? Belum ada konten yang memakainya.`;
  }

  const others = item.totalCount - item.publishedCount;

  return `Hapus ${label}? ${item.publishedCount} konten terbit${
    others > 0 ? ` dan ${others} konten lain` : ''
  } akan kehilangan kaitan ini. Kontennya tidak ikut terhapus.`;
}

function RowShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-ink-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold break-words text-ink-900">{title}</p>
          <p className="mt-1 text-xs text-ink-500">{meta}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

export default async function TaksonomiPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string | string[]; error?: string | string[] }>;
}) {
  const viewer = await requireViewer('/dashboard/taksonomi');
  const params = await searchParams;
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const canManage = profile ? can(profile.role, 'taxonomy:manage') : false;

  const sukses = firstValue(params.sukses);
  const errorParam = firstValue(params.error);

  let categories: CategoryManage[] = [];
  let speakers: SpeakerManage[] = [];
  let tags: TagManage[] = [];
  let loadError: string | null = null;

  if (canManage) {
    try {
      const [categoryData, speakerData, tagData] = await Promise.all([
        apiFetch('/categories/manage'),
        apiFetch('/speakers/manage'),
        apiFetch('/tags/manage'),
      ]);

      categories = categoryManageSchema.array().parse(categoryData);
      speakers = speakerManageSchema.array().parse(speakerData);
      tags = tagManageSchema.array().parse(tagData);
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat taksonomi. Coba lagi.';
    }
  }

  const orphanTags = tags.filter((tag) => tag.totalCount === 0);

  return (
    <main className="py-2 sm:py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Kelola taksonomi</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-600">
          Kategori wajib dipilih saat mengajukan review. Tag boleh bebas, penceramah bersifat
          opsional.
        </p>
      </div>

      {sukses && SUCCESS_MESSAGES[sukses] ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {SUCCESS_MESSAGES[sukses]}
        </p>
      ) : null}

      {errorParam ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorParam}
        </p>
      ) : null}

      {viewer.status === 'unconfigured' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Supabase belum dikonfigurasi.
        </div>
      ) : !profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Profil Anda belum terbaca dari API.
        </div>
      ) : !canManage ? (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
          Halaman ini khusus admin yang boleh mengelola taksonomi.
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
          {loadError}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Kategori */}
          <section className="rounded-3xl border border-ink-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink-900">Kategori</h2>
            <p className="mt-1 text-xs text-ink-500">
              Slug dibuat dari nama saat pertama ditambahkan dan tidak ikut berubah saat nama
              diubah, agar tautan lama tetap berfungsi.
            </p>

            <form action={createCategoryAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="flex-1 text-sm">
                <span className="sr-only">Nama kategori baru</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="Nama kategori baru"
                  className={fieldClass}
                />
              </label>
              <button type="submit" className={`${primaryButtonClass} sm:self-end`}>
                Tambah
              </button>
            </form>

            {categories.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
                Belum ada kategori. Tambahkan minimal satu agar kontributor bisa mengajukan review.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {categories.map((category) => (
                  <RowShell
                    key={category.id}
                    title={category.name}
                    meta={`/${category.slug} · ${countLabel(category)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <details className="w-full sm:w-auto">
                        <summary className={secondaryButtonClass}>Ubah</summary>
                        <form
                          action={renameCategoryAction}
                          className="mt-2 flex flex-col gap-2 sm:flex-row"
                        >
                          <input type="hidden" name="id" value={category.id} />
                          <input
                            name="name"
                            required
                            minLength={2}
                            maxLength={60}
                            defaultValue={category.name}
                            aria-label={`Nama baru untuk ${category.name}`}
                            className={fieldClass}
                          />
                          <button type="submit" className={primaryButtonClass}>
                            Simpan
                          </button>
                        </form>
                      </details>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={category.id} />
                        <ConfirmButton
                          message={deleteMessage(`kategori "${category.name}"`, category)}
                          className={dangerButtonClass}
                        >
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </RowShell>
                ))}
              </ul>
            )}
          </section>

          {/* Penceramah */}
          <section className="rounded-3xl border border-ink-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink-900">Penceramah</h2>
            <p className="mt-1 text-xs text-ink-500">
              Opsional pada konten. Menghapus penceramah tidak menghapus kontennya.
            </p>

            <form action={createSpeakerAction} className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                <span className="font-medium text-ink-800">Nama</span>
                <input name="name" required minLength={2} maxLength={120} className={fieldClass} />
              </label>
              <label className="text-sm">
                <span className="font-medium text-ink-800">
                  URL avatar <span className="font-normal text-ink-500">(opsional)</span>
                </span>
                <input name="avatarUrl" type="url" className={fieldClass} />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="font-medium text-ink-800">
                  Bio <span className="font-normal text-ink-500">(opsional)</span>
                </span>
                <textarea name="bio" rows={2} maxLength={500} className={fieldClass} />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={primaryButtonClass}>
                  Tambah penceramah
                </button>
              </div>
            </form>

            {speakers.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
                Belum ada penceramah. Konten tetap bisa disimpan tanpa penceramah.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {speakers.map((speaker) => (
                  <RowShell
                    key={speaker.id}
                    title={speaker.name}
                    meta={`/${speaker.slug} · ${countLabel(speaker)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <details className="w-full sm:w-auto">
                        <summary className={secondaryButtonClass}>Ubah</summary>
                        <form
                          action={updateSpeakerAction}
                          className="mt-2 grid gap-2 sm:grid-cols-2"
                        >
                          <input type="hidden" name="id" value={speaker.id} />
                          <label className="text-sm">
                            <span className="font-medium text-ink-800">Nama</span>
                            <input
                              name="name"
                              required
                              minLength={2}
                              maxLength={120}
                              defaultValue={speaker.name}
                              className={fieldClass}
                            />
                          </label>
                          <label className="text-sm">
                            <span className="font-medium text-ink-800">URL avatar</span>
                            <input
                              name="avatarUrl"
                              type="url"
                              defaultValue={speaker.avatarUrl ?? ''}
                              className={fieldClass}
                            />
                          </label>
                          <label className="text-sm sm:col-span-2">
                            <span className="font-medium text-ink-800">Bio</span>
                            <textarea
                              name="bio"
                              rows={2}
                              maxLength={500}
                              defaultValue={speaker.bio ?? ''}
                              className={fieldClass}
                            />
                          </label>
                          <div className="sm:col-span-2">
                            <button type="submit" className={primaryButtonClass}>
                              Simpan
                            </button>
                          </div>
                        </form>
                      </details>
                      <form action={deleteSpeakerAction}>
                        <input type="hidden" name="id" value={speaker.id} />
                        <ConfirmButton
                          message={deleteMessage(`penceramah "${speaker.name}"`, speaker)}
                          className={dangerButtonClass}
                        >
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </RowShell>
                ))}
              </ul>
            )}
          </section>

          {/* Tag */}
          <section className="rounded-3xl border border-ink-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Tag</h2>
                <p className="mt-1 text-xs text-ink-500">
                  Tag dibuat otomatis dari formulir konten. Gabungkan dua tag yang mirip agar
                  relasinya menyatu.
                </p>
              </div>
              <form action={cleanupOrphanTagsAction}>
                <button
                  type="submit"
                  disabled={orphanTags.length === 0}
                  className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Hapus tag yatim ({orphanTags.length})
                </button>
              </form>
            </div>

            {tags.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
                Belum ada tag. Tag akan muncul di sini setelah dipakai pada konten.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {tags.map((tag) => {
                  const targets = tags.filter((other) => other.id !== tag.id);

                  return (
                    <RowShell
                      key={tag.id}
                      title={tag.name}
                      meta={`/${tag.slug} · ${countLabel(tag)}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <details className="w-full sm:w-auto">
                          <summary className={secondaryButtonClass}>Ubah</summary>
                          <form
                            action={renameTagAction}
                            className="mt-2 flex flex-col gap-2 sm:flex-row"
                          >
                            <input type="hidden" name="id" value={tag.id} />
                            <input
                              name="name"
                              required
                              minLength={2}
                              maxLength={30}
                              defaultValue={tag.name}
                              aria-label={`Nama baru untuk tag ${tag.name}`}
                              className={fieldClass}
                            />
                            <button type="submit" className={primaryButtonClass}>
                              Simpan
                            </button>
                          </form>
                        </details>

                        {targets.length > 0 ? (
                          <details className="w-full sm:w-auto">
                            <summary className={secondaryButtonClass}>Gabungkan</summary>
                            <form
                              action={mergeTagAction}
                              className="mt-2 flex flex-col gap-2 sm:flex-row"
                            >
                              <input type="hidden" name="id" value={tag.id} />
                              <label className="text-sm">
                                <span className="sr-only">
                                  Tag tujuan penggabungan untuk {tag.name}
                                </span>
                                <select
                                  name="targetId"
                                  required
                                  defaultValue=""
                                  className={fieldClass}
                                >
                                  <option value="" disabled>
                                    Pilih tag tujuan
                                  </option>
                                  {targets.map((target) => (
                                    <option key={target.id} value={target.id}>
                                      {target.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <ConfirmButton
                                message={`Gabungkan "${tag.name}" ke tag tujuan? Relasi konten dipindahkan tanpa duplikasi, lalu "${tag.name}" dihapus.`}
                                className={primaryButtonClass}
                              >
                                Gabungkan
                              </ConfirmButton>
                            </form>
                          </details>
                        ) : null}

                        <form action={deleteTagAction}>
                          <input type="hidden" name="id" value={tag.id} />
                          <ConfirmButton
                            message={deleteMessage(`tag "${tag.name}"`, tag)}
                            className={dangerButtonClass}
                          >
                            Hapus
                          </ConfirmButton>
                        </form>
                      </div>
                    </RowShell>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
