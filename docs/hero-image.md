# Foto dan Ayat Hero

Hero beranda punya panel visual di kolom kanan. Isinya ditentukan sepenuhnya oleh
`apps/web/src/lib/hero.ts`; tidak ada pembacaan folder atau unggahan otomatis.

## Keadaan panel

1. `HERO_IMAGE` terisi — foto tampil dalam bingkai 4/5 (maksimal ±520px).
2. `HERO_AYAT` terisi — kartu ayat solid terang tampil di tepi bawah foto, atau
   di dalam panel berpola bila tidak ada foto.
3. Keduanya `null` — panel berpola menampilkan konten terbaru. Bila belum ada
   konten terbit, tampil pesan ringkas, bukan kolom kosong.

## Spesifikasi foto

- Milik sendiri, atau berlisensi bebas untuk penggunaan komersial. Simpan bukti
  lisensi (tautan/surat izin) di luar repo dan catat pemiliknya pada `credit`.
- Lebar minimal 1600px. Kirim sebagai WebP, AVIF, atau JPEG dengan target
  ≤150 KB untuk tampilan ponsel.
- Tanpa watermark, tanpa teks promosi, dan tanpa wajah orang tanpa izin.
- Tidak boleh gambar stok/AI hasil generate. Gunakan foto asli.

## Cara mengisi

Letakkan berkas di `apps/web/public/hero/`, lalu isi:

```ts
export const HERO_IMAGE: HeroImage | null = {
  src: '/hero/hero.webp',
  width: 1600,
  height: 2000,
  alt: '', // kosongkan bila foto murni dekoratif
  credit: 'Nama Pemilik / Lisensi',
};
```

`width` dan `height` wajib sesuai rasio asli berkas agar tidak ada layout shift.
Komponen memakai `next/image` dengan `priority` dan
`sizes="(min-width: 1024px) 45vw, 100vw"`.

Untuk ayat:

```ts
export const HERO_AYAT: HeroAyat | null = {
  arab: '...', // salin dari rujukan tepercaya
  terjemahan: '...',
  sumber: 'QS. ... : ...',
  verifiedBy: 'Nama pemeriksa',
  verifiedAt: 'YYYY-MM-DD',
};
```

Jangan menulis teks Arab, hadis, atau terjemahan dari ingatan. Ayat hanya boleh
tampil setelah diperiksa manusia; `verifiedBy` dan `verifiedAt` wajib diisi dan
dijaga oleh `isHeroAyatComplete` beserta tes di `apps/web/src/lib/hero.test.ts`.

## Arahan artistik

- Foto asli masjid atau majelis setempat saat cahaya alami.
- Detail jarak dekat: mimbar, kitab terbuka, sajadah, arsitektur lokal.
- Hindari bulan sabit, lampion bergradasi, render 3D, dan siluet kubah generik.
- Pilih komposisi vertikal yang tetap terbaca saat dipotong 4/5.
