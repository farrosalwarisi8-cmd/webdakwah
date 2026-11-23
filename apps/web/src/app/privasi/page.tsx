import type { Metadata } from 'next';
import Link from 'next/link';

import { InfoList, InfoPage, InfoSection, LegalDraftNotice } from '@/components/public/info-page';
import { contactChannels, legalReviewStatus, managerName, retentionLabel } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kebijakan privasi',
  description:
    'Data apa yang dikumpulkan WebDakwah, bagaimana data itu dipakai, dan cara menghubungi pengelola.',
  alternates: { canonical: '/privasi' },
};

export default function PrivasiPage() {
  const review = legalReviewStatus();
  const channels = contactChannels();
  const manager = managerName();

  return (
    <InfoPage
      eyebrow="Kebijakan privasi"
      title="Data Anda dan cara kami memperlakukannya"
      intro="Halaman ini menjelaskan data yang benar-benar diproses oleh situs ini. Isinya disusun dari perilaku aplikasi saat ini, bukan dari template umum."
    >
      <LegalDraftNotice reviewedAt={review.reviewedAt} />

      <InfoSection title="Siapa yang mengelola">
        {manager ? (
          <p>Data pada situs ini dikelola oleh {manager}.</p>
        ) : (
          <p>
            Pengelola situs belum mencantumkan nama. Pemilik situs wajib mengisi bagian ini sebelum
            kebijakan dipublikasikan.
          </p>
        )}
        <p>
          Pertanyaan tentang data pribadi dapat disampaikan lewat halaman{' '}
          <Link
            href="/kontak"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kontak
          </Link>
          {channels.length === 0 ? ' (kanal kontak belum diisi pengelola).' : '.'}
        </p>
      </InfoSection>

      <InfoSection title="Data yang kami proses">
        <p>Pengunjung dapat membaca seluruh konten tanpa akun. Data baru diproses ketika Anda:</p>
        <InfoList
          items={[
            <>
              <strong>Mendaftar sebagai kontributor</strong> — email, nama, dan status verifikasi
              email disimpan di layanan autentikasi (Supabase Auth). Kata sandi disimpan dalam
              bentuk hash oleh layanan tersebut; situs ini tidak pernah menerima kata sandi dalam
              bentuk terbaca.
            </>,
            <>
              <strong>Menulis konten</strong> — judul, isi, bahan media yang Anda unggah, serta
              status review dan catatan admin tersimpan di basis data. Nama penulis tampil pada
              konten terbit; email tidak ditampilkan di halaman publik.
            </>,
            <>
              <strong>Mengikuti siaran</strong> — bila Anda masuk lalu menekan ikuti siaran,
              tersimpan satu baris berisi akun Anda dan channel yang diikuti. Jumlah pengikut tampil
              publik sebagai angka, tanpa identitas.
            </>,
            <>
              <strong>Menyimpan konten</strong> — daftar simpanan dan penanda "jangan tampilkan
              kartu pasang aplikasi" disimpan di{' '}
              <code className="font-mono text-xs">localStorage</code> peramban Anda (
              <code className="font-mono text-xs">webdakwah:bookmarks</code>,{' '}
              <code className="font-mono text-xs">webdakwah:install-dismissed</code>). Data ini
              tidak dikirim ke server dan hilang bila Anda membersihkan data situs.
            </>,
            <>
              <strong>Membuka halaman yang butuh sesi</strong> — sesi login disimpan sebagai cookie
              oleh Supabase. Cookie ini diperlukan agar Anda tetap masuk; tanpa itu dashboard tidak
              dapat dipakai.
            </>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Data teknis dan log">
        <p>
          Server web, API, dan penyedia hosting dapat mencatat data teknis seperti alamat IP, waktu
          permintaan, dan jenis peramban untuk keperluan keamanan, pembatasan laju permintaan, dan
          penelusuran gangguan. Log tidak dipakai untuk membuat profil iklan.
        </p>
        <p>
          Situs ini tidak memasang pelacak iklan atau analitik pihak ketiga. Bila pemilik situs
          menambahkan layanan semacam itu di kemudian hari, halaman ini wajib diperbarui lebih dulu.
        </p>
      </InfoSection>

      <InfoSection title="Layanan pihak ketiga">
        <InfoList
          items={[
            <>
              <strong>Supabase</strong> — autentikasi, basis data, dan pengiriman email verifikasi
              serta pemulihan kata sandi.
            </>,
            <>
              <strong>Penyimpanan objek (mis. Cloudflare R2)</strong> — berkas media yang diunggah
              kontributor dan admin.
            </>,
            <>
              <strong>Penyedia hosting</strong> — menjalankan situs web dan API.
            </>,
            <>
              <strong>Layanan video dan tautan rujukan</strong> — saat Anda membuka video atau
              tautan dari layanan lain, penyedia tersebut dapat menerima data teknis sesuai
              kebijakan mereka. Situs ini tidak mengirimkan data akun Anda ke mereka.
            </>,
          ]}
        />
        <p>
          Daftar penyedia di atas mengikuti fitur yang benar-benar dipakai aplikasi. Nama penyedia
          tertentu dapat berbeda pada instalasi lain.
        </p>
      </InfoSection>

      <InfoSection title="Masa simpan">
        <p>{retentionLabel()}</p>
        <p>
          Konten yang dihapus dan akun yang dihapus tidak lagi ditampilkan. Salinan cadangan
          operasional dan catatan keamanan dapat tersimpan lebih lama sampai siklus pencadangan
          berakhir.
        </p>
      </InfoSection>

      <InfoSection title="Hak Anda">
        <InfoList
          items={[
            'Meminta salinan data akun Anda.',
            'Meminta perbaikan nama atau email yang keliru.',
            'Meminta penghapusan akun beserta konten yang belum terbit.',
            'Menarik persetujuan dengan berhenti memakai akun; situs tetap dapat dibaca tanpa akun.',
          ]}
        />
        <p>
          Permintaan dikirim lewat kanal kontak resmi dengan menyebutkan email yang dipakai saat
          mendaftar. Kami dapat meminta bukti kepemilikan akun sebelum memproses permintaan.
        </p>
      </InfoSection>

      <InfoSection title="Keamanan">
        <p>
          Akses ke dashboard memakai sesi terautentikasi dan hak akses diperiksa di server, bukan
          hanya di tampilan. Meski demikian, tidak ada sistem yang sepenuhnya bebas risiko; gunakan
          kata sandi yang unik dan jangan bagikan tautan pemulihan kepada siapa pun.
        </p>
      </InfoSection>

      <InfoSection title="Perubahan kebijakan">
        <p>
          Bila perilaku situs berubah (misalnya menambah layanan baru), halaman ini akan diperbarui.
          Tanggal tinjauan tercantum di bagian atas agar Anda tahu versi mana yang berlaku.
        </p>
        <p>
          Ketentuan penggunaan situs dijelaskan di{' '}
          <Link
            href="/syarat"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            halaman syarat
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
