import type { Metadata } from 'next';
import Link from 'next/link';

import { InfoList, InfoPage, InfoSection } from '@/components/public/info-page';

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Tentang WebDakwah: kumpulan artikel, audio kajian, video pendek, dan tautan rujukan yang ditinjau admin sebelum terbit.',
  alternates: { canonical: '/tentang' },
};

export default function TentangPage() {
  return (
    <InfoPage
      eyebrow="Tentang"
      title="Ruang kajian yang ditinjau sebelum terbit"
      intro="WebDakwah mengumpulkan artikel, audio kajian, video pendek, dan tautan rujukan berbahasa Indonesia. Setiap materi diperiksa admin sebelum dapat dibaca publik."
    >
      <InfoSection title="Apa yang ada di sini">
        <InfoList
          items={[
            <>
              <strong>Artikel</strong> — tulisan yang bisa dibaca langsung di situs, termasuk
              ringkasan dan daftar rujukan.
            </>,
            <>
              <strong>Audio kajian</strong> — rekaman ceramah dengan pemutar yang tetap berjalan
              saat Anda berpindah halaman, serta transkrip bila penulis menyediakannya.
            </>,
            <>
              <strong>Video pendek</strong> — video yang ditautkan dari layanan video dan diputar di
              halaman ini.
            </>,
            <>
              <strong>Tautan rujukan</strong> — alamat situs lain yang relevan dan relevan untuk
              didalami, dengan tanda jelas bahwa tautan membuka website lain.
            </>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Bagaimana konten diterbitkan">
        <InfoList
          items={[
            'Kontributor menulis materi dan menyimpannya sebagai draf.',
            <>
              Setelah lengkap, penulis <strong>mengajukan review</strong> dan konten masuk antrean
              admin.
            </>,
            <>
              Admin memeriksa isi, sumber, dan kelengkapan. Konten bisa <strong>diterbitkan</strong>{' '}
              atau <strong>ditolak</strong> dengan catatan yang dapat dibaca penulis.
            </>,
            <>
              Admin juga dapat <strong>mengarsipkan</strong> konten yang sudah terbit; konten arsip
              hilang dari halaman publik, sitemap, dan hasil pencarian.
            </>,
          ]}
        />
        <p>
          Alur ini berlaku juga untuk materi lama. Tidak ada konten yang tampil di halaman publik
          tanpa status terbit.
        </p>
      </InfoSection>

      <InfoSection title="Menyimpan dan mendengarkan tanpa koneksi">
        <p>
          Situs ini dapat dipasang di layar utama ponsel (PWA). Konten yang Anda simpan disimpan di
          perangkat Anda sendiri agar bisa dibuka kembali saat koneksi buruk. Data simpanan tidak
          dikirim ke server; lihat{' '}
          <Link
            href="/privasi"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kebijakan privasi
          </Link>{' '}
          untuk rinciannya.
        </p>
      </InfoSection>

      <InfoSection title="Kontribusi dan koreksi">
        <p>
          Jika Anda menemukan kekeliruan, sumber yang perlu dilengkapi, atau konten yang tidak
          semestinya tayang, sampaikan lewat halaman{' '}
          <Link
            href="/kontak"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kontak
          </Link>
          . Laporan akan diteruskan ke admin untuk ditinjau.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
