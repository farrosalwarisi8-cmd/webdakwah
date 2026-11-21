'use client';

import { CloudOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-200/70 bg-surface-soft p-4 sm:flex-row sm:items-start sm:gap-4"
    >
      <span
        aria-hidden
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          online ? 'bg-brand-50 text-brand-700' : 'bg-accent-100 text-accent-700'
        }`}
      >
        {online ? <Wifi className="size-5" /> : <CloudOff className="size-5" />}
      </span>

      <div className="text-sm leading-relaxed">
        <p className="font-semibold text-ink-900">
          {online ? 'Anda terhubung ke internet' : 'Anda sedang offline'}
        </p>
        <p className="mt-1 text-ink-600">
          {online
            ? 'Kajian yang pernah Anda buka tetap tersimpan di perangkat ini dan bisa dibaca lagi tanpa koneksi.'
            : 'Daftar ini dan kajian yang pernah Anda buka tetap bisa dibaca dari simpanan di perangkat ini.'}
        </p>
        <p className="mt-1 text-xs text-ink-500">
          Simpanan hanya tersimpan di perangkat ini, tidak tersinkron ke akun.
        </p>
      </div>
    </div>
  );
}
