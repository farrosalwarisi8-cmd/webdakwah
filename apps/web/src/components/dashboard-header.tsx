import { notificationUnreadSchema, ROLE_LABELS } from '@webdakwah/shared';
import { Bell, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { DashboardMobileNav } from '@/components/dashboard-mobile-nav';
import { apiFetch } from '@/lib/api/server';
import { signOutAction } from '@/lib/auth/actions';
import { getViewer } from '@/lib/auth/viewer';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export async function DashboardHeader() {
  const viewer = await getViewer();
  const profile = viewer.status === 'authenticated' ? viewer.profile : null;
  const displayName = profile?.fullName ?? profile?.email ?? '';
  let unread = 0;

  if (profile) {
    try {
      unread = notificationUnreadSchema.parse(await apiFetch('/notifications/unread-count')).unread;
    } catch {
      // Lonceng tidak boleh membuat dashboard gagal tampil.
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-surface-soft/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="WebDakwah, dashboard"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-900 text-accent-400 shadow-soft transition group-hover:bg-brand-800">
              <BookOpen aria-hidden className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-900">WebDakwah</span>
          </Link>
          <span aria-hidden className="hidden h-6 w-px bg-ink-200 md:block" />
          <span className="hidden text-xs font-medium tracking-wide text-ink-600 md:block">
            Ruang kerja
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DashboardMobileNav isAdmin={profile?.role === 'ADMIN'} />

          {profile ? (
            <Link
              href="/dashboard/notifikasi"
              aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
              className="btn-press relative grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <Bell aria-hidden className="size-4.5" />
              {unread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[10px] leading-5 font-bold text-ink-950">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Link>
          ) : null}

          <Link
            href="/"
            className="hidden min-h-11 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 md:inline-flex"
          >
            Lihat situs
            <ExternalLink aria-hidden className="size-3.5" />
          </Link>

          {profile ? (
            <Link
              href="/akun"
              className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pr-3 pl-1 xl:flex"
            >
              <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                {initials(displayName) || 'WD'}
              </span>
              <span className="max-w-32 truncate text-xs font-medium text-ink-700">
                {ROLE_LABELS[profile.role]}
              </span>
            </Link>
          ) : null}

          <form action={signOutAction}>
            <button
              type="submit"
              className="btn-press min-h-11 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 sm:px-4"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
