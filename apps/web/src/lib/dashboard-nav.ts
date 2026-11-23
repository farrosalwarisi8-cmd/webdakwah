import {
  Archive,
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const WORKSPACE_ITEMS: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/dashboard/konten', label: 'Konten saya', icon: FileText, exact: true },
];

export const ADMIN_ITEMS: DashboardNavItem[] = [
  { href: '/dashboard/moderasi', label: 'Review konten', icon: ShieldCheck },
  { href: '/dashboard/terbitan', label: 'Semua konten', icon: Archive },
  { href: '/dashboard/pengguna', label: 'Pengguna', icon: Users },
  { href: '/dashboard/siaran', label: 'Siaran', icon: Radio },
  { href: '/dashboard/taksonomi', label: 'Taksonomi', icon: Tags },
  { href: '/dashboard/statistik', label: 'Statistik', icon: BarChart3 },
];

export const ACCOUNT_ITEMS: DashboardNavItem[] = [
  { href: '/akun', label: 'Akun', icon: UserRound },
];

export function isDashboardNavActive(pathname: string, item: DashboardNavItem): boolean {
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
