'use client';

import { Menu, Plus, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ACCOUNT_ITEMS,
  ADMIN_ITEMS,
  WORKSPACE_ITEMS,
  isDashboardNavActive,
  type DashboardNavItem,
} from '@/lib/dashboard-nav';

function DrawerLink({
  item,
  pathname,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isDashboardNavActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-50 text-brand-900'
          : 'text-ink-600 hover:bg-surface-soft hover:text-brand-800'
      }`}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

/**
 * Drawer navigasi dashboard untuk layar kecil. Isinya memakai daftar yang sama
 * dengan sidebar desktop supaya tidak ada menu yang hilang saat berpindah
 * ukuran layar.
 */
export function DashboardMobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="dashboard-drawer"
        aria-label="Buka menu dashboard"
        className="btn-press grid size-11 shrink-0 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-300 hover:text-brand-700 lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                aria-hidden="true"
                onClick={close}
                className="absolute inset-0 animate-in fade-in bg-brand-950/40 backdrop-blur-sm duration-150"
              />

              <div
                id="dashboard-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Menu dashboard"
                className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-in flex-col bg-white shadow-lift duration-200 slide-in-from-left-4"
              >
                <div className="flex h-16 items-center justify-between gap-2 border-b border-ink-100 px-4">
                  <p className="text-sm font-semibold text-ink-900">Menu ruang kerja</p>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    aria-label="Tutup menu dashboard"
                    className="btn-press grid size-11 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
                  >
                    <X aria-hidden className="size-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Link
                    href="/dashboard/konten/baru"
                    onClick={close}
                    className="btn-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-ink-950 shadow-soft transition hover:bg-accent-400"
                  >
                    <Plus aria-hidden className="size-4" />
                    Buat konten baru
                  </Link>

                  <nav aria-label="Navigasi dashboard" className="mt-3 flex flex-col gap-0.5">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                      Ruang kerja
                    </p>
                    {WORKSPACE_ITEMS.map((item) => (
                      <DrawerLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={close}
                      />
                    ))}

                    {isAdmin ? (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                          Kelola
                        </p>
                        {ADMIN_ITEMS.map((item) => (
                          <DrawerLink
                            key={item.href}
                            item={item}
                            pathname={pathname}
                            onNavigate={close}
                          />
                        ))}
                      </>
                    ) : null}

                    <span aria-hidden className="my-1 block border-t border-ink-100" />
                    {ACCOUNT_ITEMS.map((item) => (
                      <DrawerLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={close}
                      />
                    ))}
                  </nav>

                  <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-soft p-3.5 text-[11px] leading-relaxed text-ink-600">
                    <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-brand-700" />
                    Setiap konten ditinjau admin sebelum terbit. Draf aman tersimpan.
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
