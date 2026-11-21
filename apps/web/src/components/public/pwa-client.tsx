'use client';

import { Download, WifiOff, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  dismissInstallPrompt,
  isStandaloneDisplay,
  registerServiceWorker,
  wasInstallPromptDismissed,
} from '@/lib/pwa';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaClient() {
  const pathname = usePathname();
  const [offline, setOffline] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(true);

  useEffect(() => {
    registerServiceWorker();
    setOffline(!navigator.onLine);
    setInstallDismissed(wasInstallPromptDismissed());

    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => setInstallEvent(null);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const showInstall =
    installEvent !== null &&
    !installDismissed &&
    !isStandaloneDisplay() &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/masuk');

  async function install() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === 'dismissed') {
      dismissInstallPrompt();
      setInstallDismissed(true);
    }

    setInstallEvent(null);
  }

  function dismiss() {
    dismissInstallPrompt();
    setInstallDismissed(true);
  }

  return (
    <>
      {offline ? (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-ink-950 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm"
        >
          <WifiOff aria-hidden className="size-4 shrink-0 text-accent-400" />
          <span>
            Anda sedang offline. Halaman yang sudah dibuka dan kajian tersimpan tetap bisa dibaca.
          </span>
        </div>
      ) : null}

      {showInstall ? (
        <div
          role="region"
          aria-label="Pasang aplikasi"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-ink-200 bg-white p-3 shadow-soft sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:p-4"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-900 text-accent-400">
              <Download aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">Pasang WebDakwah</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                Buka lebih cepat dari layar utama dan baca kajian tersimpan tanpa internet.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex min-h-9 items-center rounded-full bg-brand-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-900"
                >
                  Pasang
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex min-h-9 items-center rounded-full border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600 transition hover:border-ink-300 hover:text-ink-800"
                >
                  Nanti
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup ajakan memasang aplikasi"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
