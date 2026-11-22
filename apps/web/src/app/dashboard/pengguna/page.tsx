import { ROLE_LABELS, userSummarySchema, type UserSummary } from '@webdakwah/shared';
import type { Metadata } from 'next';

import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  updateUserAction,
} from './actions';

export const metadata: Metadata = {
  title: 'Kelola pengguna',
  robots: { index: false, follow: false },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  ditambahkan: 'Pengguna baru berhasil ditambahkan.',
  diperbarui: 'Pengguna berhasil diperbarui.',
  katasandi: 'Kata sandi berhasil direset.',
  dihapus: 'Pengguna berhasil dihapus.',
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string | string[]; error?: string | string[] }>;
}) {
  const viewer = await requireViewer('/dashboard/pengguna');
  const params = await searchParams;
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const isAdmin = profile?.role === 'ADMIN';

  const sukses = firstValue(params.sukses);
  const errorParam = firstValue(params.error);

  let users: UserSummary[] = [];
  let loadError: string | null = null;

  if (isAdmin) {
    try {
      users = userSummarySchema.array().parse(await apiFetch('/users'));
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat pengguna. Coba lagi.';
    }
  }

  return (
    <main className="py-2 sm:py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Kelola pengguna</h1>
        <p className="mt-1 text-sm text-ink-600">
          Buat akun kontributor/admin dan kelola status aksesnya.
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
      ) : !isAdmin ? (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-700">
          Halaman ini khusus admin.
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-3xl border border-ink-200 bg-white p-6">
            <h2 className="text-base font-semibold text-ink-900">Tambah pengguna</h2>
            <form action={createUserAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink-800">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-800">Kata sandi</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-800">Nama lengkap</span>
                <input
                  name="fullName"
                  className="mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-800">Role</span>
                <select
                  name="role"
                  defaultValue="CONTRIBUTOR"
                  className="mt-1 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm"
                >
                  <option value="CONTRIBUTOR">Kontributor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Tambah pengguna
                </button>
              </div>
            </form>
          </section>

          {loadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
              {loadError}
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {users.map((user) => (
                <li key={user.id} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-ink-900">
                        {user.fullName ?? user.email}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {user.email} · {ROLE_LABELS[user.role]} ·{' '}
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </p>
                      <p
                        className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.emailVerifiedAt
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {user.emailVerifiedAt ? 'Email terverifikasi' : 'Email belum terverifikasi'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={updateUserAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-xl border border-ink-200 px-3 py-2 text-xs"
                        >
                          <option value="CONTRIBUTOR">Kontributor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <select
                          name="isActive"
                          defaultValue={user.isActive ? 'true' : 'false'}
                          className="rounded-xl border border-ink-200 px-3 py-2 text-xs"
                        >
                          <option value="true">Aktif</option>
                          <option value="false">Nonaktif</option>
                        </select>
                        <input name="fullName" type="hidden" value={user.fullName ?? ''} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                        >
                          Simpan
                        </button>
                      </form>
                      <form action={resetPasswordAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <input
                          name="password"
                          type="password"
                          required
                          minLength={8}
                          placeholder="Kata sandi baru"
                          className="rounded-xl border border-ink-200 px-3 py-2 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-200 px-4 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-50"
                        >
                          Reset
                        </button>
                      </form>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
