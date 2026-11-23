import {
  ACCOUNT_STATUS_LABELS,
  ROLE_LABELS,
  userSummarySchema,
  type UserSummary,
} from '@webdakwah/shared';
import type { Metadata } from 'next';

import { ConfirmButton } from '@/components/confirm-button';
import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';

import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  sendResetLinkAction,
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
  tautan: 'Tautan pengaturan kata sandi sudah dikirim ke email pengguna.',
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

  const pendingUsers = users.filter((user) => user.accountStatus === 'PENDING');

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
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Menunggu persetujuan ({pendingUsers.length})
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              Akun pendaftaran mandiri bisa masuk dan membaca dashboard, tetapi belum bisa membuat
              atau mengajukan konten sampai disetujui.
            </p>

            {pendingUsers.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-ink-300 px-4 py-5 text-center text-sm text-ink-500">
                Tidak ada pendaftar yang menunggu.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {pendingUsers.map((user) => (
                  <li
                    key={user.id}
                    className="rounded-2xl border border-ink-200 bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words text-ink-900">
                        {user.fullName ?? user.email}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {user.email} ·{' '}
                        {user.emailVerifiedAt ? 'email terverifikasi' : 'email belum terverifikasi'}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                      <form action={updateUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="accountStatus" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                        >
                          Setujui
                        </button>
                      </form>
                      <form action={updateUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="accountStatus" value="REJECTED" />
                        <ConfirmButton
                          message={`Tolak pendaftaran ${user.email}? Akun tetap bisa masuk dan membaca dashboard, tetapi tidak bisa membuat atau mengajukan konten sampai disetujui admin.`}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Tolak
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
                      </p>{' '}
                      <p
                        className={`mt-2 ml-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.accountStatus === 'APPROVED'
                            ? 'bg-brand-50 text-brand-800'
                            : user.accountStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ACCOUNT_STATUS_LABELS[user.accountStatus]}
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
                        <ConfirmButton
                          message={`Simpan perubahan untuk ${user.email}? Bila status diubah menjadi Nonaktif, pengguna langsung tidak bisa masuk.`}
                          className="rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                        >
                          Simpan
                        </ConfirmButton>
                      </form>
                      <form
                        action={resetPasswordAction}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-2"
                      >
                        <input type="hidden" name="id" value={user.id} />
                        <label
                          className="text-xs font-medium text-amber-900"
                          htmlFor={`pw-${user.id}`}
                        >
                          Kata sandi baru
                        </label>
                        <input
                          id={`pw-${user.id}`}
                          name="password"
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          aria-describedby={`pw-help-${user.id}`}
                          placeholder="Minimal 8 karakter"
                          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs"
                        />
                        <span
                          id={`pw-help-${user.id}`}
                          className="w-full text-[11px] leading-relaxed text-amber-900"
                        >
                          Kata sandi lama langsung tidak berlaku. Sampaikan kata sandi baru kepada
                          pengguna lewat jalur yang aman.
                        </span>
                        <ConfirmButton
                          message={`Reset kata sandi ${user.email}? Kata sandi lama langsung tidak berlaku dan pengguna harus memakai kata sandi baru untuk masuk.`}
                          className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                        >
                          Reset kata sandi
                        </ConfirmButton>
                      </form>
                      <form action={sendResetLinkAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                        >
                          Kirim tautan reset
                        </button>
                      </form>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <ConfirmButton
                          message={`Hapus pengguna ${user.email}? Akun dan profilnya dihapus permanen sehingga tidak bisa masuk lagi. Tindakan ini tidak bisa dibatalkan.`}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Hapus
                        </ConfirmButton>
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
