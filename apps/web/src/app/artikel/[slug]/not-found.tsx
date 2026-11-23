import type { Metadata } from 'next';

import { StatusPage } from '@/components/public/status-page';

export const metadata: Metadata = {
  title: 'Artikel tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Artikel tidak ditemukan"
      description="Materi ini mungkin sudah dihapus, diarsipkan, atau tautannya salah. Buka daftar artikel untuk melihat materi lain yang tersedia."
    />
  );
}
