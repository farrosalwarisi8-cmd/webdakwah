import {
  NOTIFICATION_TYPE_LABELS,
  notificationListSchema,
  type NotificationItem,
  type NotificationList,
} from '@webdakwah/shared';
import { Bell, CheckCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, apiFetch } from '@/lib/api/server';
import { requireViewer } from '@/lib/auth/require';
import { formatDateTime } from '@/lib/format';

import { markAllNotificationsReadAction, markNotificationReadAction } from './actions';

export const metadata: Metadata = {
  title: 'Notifikasi',
  robots: { index: false, follow: false },
};

const TYPE_STYLES: Record<NotificationItem['type'], string> = {
  CONTENT_SUBMITTED: 'bg-accent-100 text-accent-800',
  CONTENT_PUBLISHED: 'bg-emerald-100 text-emerald-800',
  CONTENT_REJECTED: 'bg-red-100 text-red-800',
  ACCOUNT_PENDING: 'bg-accent-100 text-accent-800',
  ACCOUNT_APPROVED: 'bg-emerald-100 text-emerald-800',
  ACCOUNT_REJECTED: 'bg-red-100 text-red-800',
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readPage(value: string | string[] | undefined): number {
  const page = Number.parseInt(firstValue(value) ?? '1', 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** Hanya tautan dashboard internal yang dibuat API yang boleh dirender. */
function safeHref(href: string | null): string | null {
  return href && (href.startsWith('/dashboard/') || href === '/akun') ? href : null;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; error?: string | string[] }>;
}) {
  const viewer = await requireViewer('/dashboard/notifikasi');
  const params = await searchParams;
  const page = readPage(params.page);
  const errorParam = firstValue(params.error);
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;

  let list: NotificationList | null = null;
  let loadError: string | null = null;

  if (profile) {
    try {
      list = notificationListSchema.parse(await apiFetch(`/notifications?page=${page}`));
    } catch (error) {
      loadError = error instanceof ApiError ? error.message : 'Gagal memuat notifikasi. Coba lagi.';
    }
  }

  return (
    <main className="py-2 sm:py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-600">
            Kabar terbaru tentang konten yang Anda tulis atau tinjau.
          </p>
        </div>

        {list && list.unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <CheckCheck aria-hidden className="size-4" />
              Tandai semua dibaca
            </button>
          </form>
        ) : null}
      </div>

      {errorParam ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorParam}
        </p>
      ) : null}

      {viewer.status === 'unconfigured' ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Supabase belum dikonfigurasi, jadi notifikasi belum bisa dimuat.
        </div>
      ) : !profile ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Profil Anda belum terbaca dari API. Pastikan API berjalan dan migrasi database sudah
          dijalankan.
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
          {loadError}
        </div>
      ) : !list || list.items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <Bell aria-hidden className="mx-auto size-6 text-ink-400" />
          <p className="mt-2 text-sm font-medium text-ink-800">Belum ada notifikasi.</p>
          <p className="mt-1 text-sm text-ink-500">
            Saat konten diajukan, diterbitkan, atau ditolak, kabarnya akan muncul di sini.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-5 text-xs text-ink-500">
            {list.total} notifikasi · {list.unread} belum dibaca
          </p>

          <ul className="mt-3 space-y-3">
            {list.items.map((item) => {
              const href = safeHref(item.href);

              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    item.isRead ? 'border-ink-200 bg-white' : 'border-brand-200 bg-brand-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_STYLES[item.type]}`}
                        >
                          {NOTIFICATION_TYPE_LABELS[item.type]}
                        </span>
                        {!item.isRead ? (
                          <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                            Baru
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-base font-semibold text-ink-900">
                        {href ? (
                          <Link href={href} className="transition hover:text-brand-700">
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                      </p>
                      {item.message ? (
                        <p className="mt-1 text-sm leading-relaxed text-ink-600">{item.message}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-ink-500">{formatDateTime(item.createdAt)}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {href ? (
                        <Link
                          href={href}
                          className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                        >
                          Buka
                        </Link>
                      ) : null}
                      {!item.isRead ? (
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                          >
                            Tandai dibaca
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {list.totalPages > 1 ? (
            <nav
              aria-label="Navigasi halaman notifikasi"
              className="mt-8 flex items-center justify-between gap-3"
            >
              {page > 1 ? (
                <Link
                  href={`/dashboard/notifikasi?page=${page - 1}`}
                  className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  ← Sebelumnya
                </Link>
              ) : (
                <span aria-hidden />
              )}
              <span className="text-xs text-ink-500">
                Halaman {list.page} dari {list.totalPages}
              </span>
              {page < list.totalPages ? (
                <Link
                  href={`/dashboard/notifikasi?page=${page + 1}`}
                  className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Berikutnya →
                </Link>
              ) : (
                <span aria-hidden />
              )}
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
