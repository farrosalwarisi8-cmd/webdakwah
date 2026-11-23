import type { Metadata } from 'next';

import { StatusPage } from '@/components/public/status-page';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Halaman tidak ditemukan"
      description="Alamat ini tidak ada, sudah dipindahkan, atau kontennya belum diterbitkan. Coba kembali ke beranda atau gunakan pencarian."
    />
  );
}
