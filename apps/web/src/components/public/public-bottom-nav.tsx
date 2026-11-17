'use client';

import { Bookmark, Compass, Home, Radio, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/cari', label: 'Jelajah', icon: Compass },
  { href: '/siaran', label: 'Siaran', icon: Radio },
  { href: '/simpanan', label: 'Simpanan', icon: Bookmark },
  { href: '/akun', label: 'Profil', icon: UserRound },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  if (href === '/cari') {
    return (
      pathname === '/cari' ||
      ['/artikel', '/audio', '/video', '/rujukan', '/kategori', '/tag', '/penceramah'].some(
        (prefix) => pathname.startsWith(prefix),
      )
    );
  }

  return pathname.startsWith(href);
}

export function PublicBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/masuk')) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="grid grid-cols-5">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? 'text-brand-700' : 'text-ink-500 hover:text-brand-700'
                }`}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div aria-hidden className="h-16 sm:hidden" />
    </>
  );
}
