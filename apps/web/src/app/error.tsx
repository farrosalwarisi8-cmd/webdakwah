'use client';

import { useEffect } from 'react';

import { StatusPage } from '@/components/public/status-page';

/**
 * Batas galat untuk seluruh halaman. Detail teknis tidak ditampilkan ke
 * pengunjung; cukup pesan ramah, tombol coba lagi, dan tautan beranda.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Simpan di konsol browser untuk keperluan admin; tidak pernah ditampilkan.
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Galat"
      title="Halaman belum bisa dimuat"
      description="Server sedang sibuk atau koneksi terputus. Coba lagi beberapa saat lagi; bila tetap gagal, kembali ke beranda."
    >
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Coba lagi
      </button>
    </StatusPage>
  );
}
