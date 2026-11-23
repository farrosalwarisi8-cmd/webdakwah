import type { Metadata } from 'next';

import { StatusPage } from '@/components/public/status-page';

export const metadata: Metadata = {
  title: 'Video tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Video tidak ditemukan"
      description="Materi ini mungkin sudah dihapus, diarsipkan, atau tautannya salah. Buka daftar video untuk melihat materi lain yang tersedia."
    />
  );
}
