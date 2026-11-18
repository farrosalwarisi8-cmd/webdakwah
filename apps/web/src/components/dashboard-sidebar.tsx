'use client';

import { Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  ACCOUNT_ITEMS,
  ADMIN_ITEMS,
  WORKSPACE_ITEMS,
  isDashboardNavActive,
  type DashboardNavItem,
} from '@/lib/dashboard-nav';

function NavLink({ item, pathname }: { item: DashboardNavItem; pathname: string }) {
  const active = isDashboardNavActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-900 text-white shadow-soft'
          : 'text-ink-600 hover:bg-brand-50 hover:text-brand-800'
      }`}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 space-y-3">
        <Link
          href="/dashboard/konten/baru"
          className="btn-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-ink-950 shadow-soft transition hover:bg-accent-400"
        >
          <Plus aria-hidden className="size-4" />
          Buat konten baru
        </Link>

        <nav
          aria-label="Navigasi dashboard"
          className="flex flex-col gap-0.5 rounded-2xl border border-ink-200/80 bg-white p-2 shadow-soft"
        >
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
            Ruang kerja
          </p>
          {WORKSPACE_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          {isAdmin ? (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                Kelola
              </p>
              {ADMIN_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </>
          ) : null}

          <span aria-hidden className="my-1 block border-t border-ink-100" />
          {ACCOUNT_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="rounded-2xl border border-ink-200/80 bg-surface-soft p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-800">
            <ShieldCheck aria-hidden className="size-3.5" />
            Sebelum terbit
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-600">
            Setiap konten ditinjau admin. Simpan draf kapan saja tanpa kehilangan pekerjaan.
          </p>
        </div>
      </div>
    </aside>
  );
}
