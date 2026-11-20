/**
 * Konfigurasi hero beranda.
 *
 * Nilai diisi manual oleh pemilik situs. Tidak ada pembacaan filesystem atau
 * pengecekan lingkungan di sini supaya hasilnya sama saat build lokal maupun
 * di Vercel.
 */

export interface HeroImage {
  /** Jalur publik, mis. `/hero/hero.webp`. */
  src: string;
  width: number;
  height: number;
  /** Kosongkan bila foto murni dekoratif. */
  alt: string;
  /** Keterangan pemilik/lisensi foto, ditampilkan kecil di bawah panel. */
  credit?: string;
}

export interface HeroAyat {
  arab: string;
  terjemahan: string;
  /** Sumber lengkap sekali saja, mis. `QS. ... : ...`. */
  sumber: string;
  /** Nama orang/lembaga yang memeriksa teks dan terjemahan. */
  verifiedBy: string;
  /** Tanggal pemeriksaan, format `YYYY-MM-DD`. */
  verifiedAt: string;
}

/** Default `null`: hero memakai panel berpola berisi konten terbaru. */
export const HERO_IMAGE: HeroImage | null = null;

/** Default `null`: tidak ada ayat yang ditampilkan. */
export const HERO_AYAT: HeroAyat | null = null;

/**
 * Ayat hanya boleh tampil bila seluruh kolom terisi, termasuk pemeriksa dan
 * tanggal pemeriksaan. Teks tidak boleh ditulis dari ingatan.
 */
export function isHeroAyatComplete(ayat: HeroAyat | null): ayat is HeroAyat {
  if (!ayat) return false;

  return [ayat.arab, ayat.terjemahan, ayat.sumber, ayat.verifiedBy, ayat.verifiedAt].every(
    (value) => value.trim().length > 0,
  );
}
