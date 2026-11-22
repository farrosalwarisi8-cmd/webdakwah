'use client';

import { Bookmark, Compass, Home, Radio, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAudioPlayer } from './audio-provider';

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
  const { track, currentTime, duration } = useAudioPlayer();

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/masuk') ||
    pathname.startsWith('/daftar') ||
    pathname.startsWith('/auth')
  ) {
    return null;
  }

  const progress = track && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        {track ? (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-ink-100" aria-hidden="true">
            <div className="h-full bg-accent-500" style={{ width: `${progress}%` }} />
          </div>
        ) : null}

        <div className="grid grid-cols-5 px-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                  active ? 'text-brand-900' : 'text-ink-500'
                }`}
              >
                <span
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition ${
                    active ? 'bg-brand-50' : 'hover:bg-surface-soft'
                  }`}
                >
                  <Icon aria-hidden className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span>{label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] sm:hidden" />
    </>
  );
}
