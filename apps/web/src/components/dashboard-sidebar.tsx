'use client';

import {
  Archive,
  BarChart3,
  FileText,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  exact?: boolean;
}

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/konten', label: 'Konten saya', icon: FileText, exact: true },
  { href: '/dashboard/konten/baru', label: 'Buat konten', icon: Plus },
  { href: '/dashboard/moderasi', label: 'Review konten', icon: ShieldCheck, adminOnly: true },
  { href: '/dashboard/terbitan', label: 'Semua konten', icon: Archive, adminOnly: true },
  { href: '/dashboard/pengguna', label: 'Pengguna', icon: Users, adminOnly: true },
  { href: '/dashboard/statistik', label: 'Statistik', icon: BarChart3, adminOnly: true },
  { href: '/akun', label: 'Akun', icon: UserRound },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/dashboard/konten') {
    const isContentDetail =
      /^\/dashboard\/konten\/[^/]+$/.test(pathname) && pathname !== '/dashboard/konten/baru';

    return pathname === item.href || isContentDetail;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="w-full lg:w-56 lg:shrink-0">
      <nav
        aria-label="Navigasi dashboard"
        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      >
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition lg:w-full ${
                active
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-ink-600 hover:bg-white hover:text-brand-700'
              }`}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
