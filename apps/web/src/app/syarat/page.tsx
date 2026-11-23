import type { Metadata } from 'next';
import Link from 'next/link';

import { InfoList, InfoPage, InfoSection, LegalDraftNotice } from '@/components/public/info-page';
import { legalReviewStatus, managerName } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Syarat penggunaan',
  description:
    'Ketentuan penggunaan WebDakwah untuk pengunjung, kontributor, dan admin, termasuk aturan konten dan moderasi.',
  alternates: { canonical: '/syarat' },
};

export default function SyaratPage() {
  const review = legalReviewStatus();
  const manager = managerName();

  return (
    <InfoPage
      eyebrow="Syarat penggunaan"
      title="Aturan memakai layanan ini"
      intro="Dengan membuka situs atau memakai akun kontributor, Anda menyetujui ketentuan di halaman ini."
    >
      <LegalDraftNotice reviewedAt={review.reviewedAt} />

      <InfoSection title="Layanan">
        <p>
          WebDakwah menyajikan materi dakwah berupa artikel, audio, video, dan tautan rujukan.
          Pengunjung dapat membaca seluruh konten terbit tanpa akun. Akun hanya diperlukan untuk
          menulis konten, mengikuti siaran, atau mengelola situs.
        </p>
        {manager ? <p>Layanan dikelola oleh {manager}.</p> : null}
      </InfoSection>

      <InfoSection title="Akun kontributor">
        <InfoList
          items={[
            'Pendaftaran mandiri hanya membuat akun berperan kontributor. Peran tidak dapat dinaikkan sendiri.',
            'Email harus diverifikasi, dan akun baru menunggu persetujuan admin sebelum dapat mengirim konten.',
            'Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas pada akun Anda.',
            'Satu orang tidak boleh membuat beberapa akun untuk menghindari batas konten atau keputusan moderasi.',
          ]}
        />
      </InfoSection>

      <InfoSection title="Aturan konten">
        <InfoList
          items={[
            'Konten harus terkait dakwah, ilmu, atau rujukan yang bermanfaat, dengan sumber yang jelas bila mengutip.',
            'Jangan mengunggah materi yang melanggar hak cipta, memuat data pribadi orang lain tanpa izin, atau menyebarkan kebencian dan kekerasan.',
            'Kutipan teks keagamaan wajib disertai sumber dan diperiksa ketelitiannya oleh penulis maupun admin.',
            'Materi media yang diunggah harus milik Anda atau dilisensikan untuk dipakai di situs ini.',
          ]}
        />
      </InfoSection>

      <InfoSection title="Moderasi dan penerbitan">
        <p>
          Setiap konten melewati review admin. Admin dapat menerbitkan, menolak dengan catatan,
          mengarsipkan, atau menghapus konten yang melanggar ketentuan. Keputusan diambil untuk
          menjaga mutu dan keamanan, dan tidak menimbulkan hak atas penerbitan.
        </p>
        <p>
          Penulis dapat menarik kembali konten yang belum terbit. Setelah terbit, perubahan
          visibilitas dilakukan oleh admin.
        </p>
      </InfoSection>

      <InfoSection title="Konten pihak ketiga">
        <p>
          Beberapa materi memuat video yang diputar dari layanan lain atau tautan menuju situs luar.
          Kami tidak mengendalikan isi maupun ketersediaan situs tersebut. Membuka tautan eksternal
          berarti Anda tunduk pada ketentuan penyedia masing-masing.
        </p>
      </InfoSection>

      <InfoSection title="Kekayaan intelektual">
        <p>
          Penulis tetap memiliki hak atas karyanya. Dengan mengirim konten, penulis memberi
          pengelola izin menyimpan, menampilkan, dan menyebarkan materi tersebut di situs ini serta
          saluran resminya. Nama situs, tata letak, dan kode aplikasi tidak boleh dipakai ulang
          tanpa izin.
        </p>
      </InfoSection>

      <InfoSection title="Batasan">
        <InfoList
          items={[
            'Materi disajikan untuk pembelajaran dan tidak menggantikan bimbingan ahli atau keputusan hukum tertentu.',
            'Situs dapat berhenti sementara untuk pemeliharaan, atau berubah karena pemeliharaan layanan pihak ketiga.',
            'Pengelola tidak menjamin ketersediaan tanpa gangguan maupun kebebasan mutlak dari kekeliruan; laporkan kekeliruan yang Anda temukan.',
          ]}
        />
      </InfoSection>

      <InfoSection title="Perubahan dan kontak">
        <p>
          Ketentuan dapat diperbarui bila fitur atau aturan berubah. Versi berlaku adalah yang
          tercantum di halaman ini. Pertanyaan dapat dikirim lewat halaman{' '}
          <Link
            href="/kontak"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kontak
          </Link>
          . Cara kami memperlakukan data Anda dijelaskan di{' '}
          <Link
            href="/privasi"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kebijakan privasi
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
