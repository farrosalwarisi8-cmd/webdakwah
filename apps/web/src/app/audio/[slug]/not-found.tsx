import type { Metadata } from 'next';

import { StatusPage } from '@/components/public/status-page';

export const metadata: Metadata = {
  title: 'Audio tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Audio tidak ditemukan"
      description="Materi ini mungkin sudah dihapus, diarsipkan, atau tautannya salah. Buka daftar audio untuk melihat materi lain yang tersedia."
    />
  );
}
