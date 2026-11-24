import type { ContentType } from '@webdakwah/shared';

import { contentPath } from './content-routes';

export const SERVICE_WORKER_URL = '/sw.js';
export const OFFLINE_PATH = '/offline';
export const INSTALL_DISMISS_KEY = 'webdakwah:install-dismissed';

/**
 * Halaman privat tidak boleh masuk cache offline. Sama dengan aturan di public/sw.js
 * dan dengan `PRIVATE_ROUTE_PREFIXES` di `lib/security/headers.ts` (dijaga tes).
 */
export const PRIVATE_PATH_PREFIXES = [
  '/dashboard',
  '/masuk',
  '/daftar',
  '/akun',
  '/auth',
  '/api',
  '/lupa-sandi',
  '/atur-sandi',
];

export function isOfflineCacheablePath(pathname: string): boolean {
  return !PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** URL detail konten yang perlu disimpan saat pengguna menandai "Simpan". */
export function contentPageUrl(type: ContentType, slug: string): string {
  return contentPath(type, slug);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function wasInstallPromptDismissed(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(INSTALL_DISMISS_KEY) === '1';
  } catch {
    return true;
  }
}

export function dismissInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, '1');
  } catch {
    // Mode privat atau penyimpanan penuh: cukup sembunyikan untuk sesi ini.
  }
}

/**
 * Service worker hanya didaftarkan pada build produksi agar cache tidak
 * mengganggu hot reload. Untuk menguji lokal: `pnpm --filter web build &&
 * pnpm --filter web start`.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch(() => {
    // Registrasi gagal (mis. browser lama) tidak boleh mengganggu halaman.
  });
}

/** Minta service worker menyimpan halaman konten beserta asetnya untuk offline. */
export function cachePagesForOffline(urls: string[]): void {
  const uniqueUrls = [...new Set(urls)].filter(Boolean);

  if (
    uniqueUrls.length === 0 ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  void (async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        return;
      }

      const worker = registration.active ?? (await navigator.serviceWorker.ready).active;
      worker?.postMessage({ type: 'CACHE_CONTENTS', urls: uniqueUrls });
    } catch {
      // Cache offline bersifat best-effort.
    }
  })();
}
