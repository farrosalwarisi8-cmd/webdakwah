import type { Metadata } from 'next';

import { StatusPage } from '@/components/public/status-page';

export const metadata: Metadata = {
  title: 'Tautan rujukan tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Tautan rujukan tidak ditemukan"
      description="Materi ini mungkin sudah dihapus, diarsipkan, atau tautannya salah. Buka daftar tautan rujukan untuk melihat materi lain yang tersedia."
    />
  );
}
