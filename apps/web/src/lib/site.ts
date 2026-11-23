/**
 * Data pemilik situs untuk halaman informasi dan kebijakan.
 *
 * ============================ ISI OLEH PEMILIK ============================
 * Semua nilai di bawah sengaja `null`. Isi hanya yang benar-benar diketahui
 * pemilik situs; jangan mengarang nama, alamat, atau nomor kontak.
 *
 * - `managerName`     : nama pengelola/perkumpulan yang bertanggung jawab.
 * - `address`         : alamat surat/kantor (boleh dikosongkan).
 * - `contactEmail`    : email kontak resmi, mis. `nama@domain-anda.com`.
 * - `contactWhatsapp` : digit saja dengan kode negara tanpa `+`, mis. `62812...`.
 * - `retentionDays`   : masa simpan data dalam hari; `null` = belum ditetapkan.
 * - `legalReviewedAt` : tanggal (ISO `YYYY-MM-DD`) kebijakan ditinjau pihak
 *                       berwenang. Selama kosong, halaman privasi/syarat
 *                       menampilkan penanda DRAF.
 *
 * Nilai yang kosong atau tidak sah tidak pernah dirender, termasuk di produksi.
 * ==========================================================================
 */

export interface SiteOwner {
  managerName: string | null;
  address: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  retentionDays: number | null;
  legalReviewedAt: string | null;
}

export const SITE_OWNER: SiteOwner = {
  managerName: null,
  address: null,
  contactEmail: null,
  contactWhatsapp: null,
  retentionDays: null,
  legalReviewedAt: null,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Format internasional tanpa `+`/spasi; `wa.me` menolak angka lokal berawalan 0. */
const WHATSAPP_PATTERN = /^[1-9]\d{7,14}$/;

/** Buang spasi tepi; string kosong dianggap "belum diisi". */
export function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';

  return trimmed.length > 0 ? trimmed : null;
}

/** Tautan `mailto:` hanya untuk alamat yang bentuknya wajar. */
export function contactEmailHref(value: string | null | undefined): string | null {
  const email = cleanText(value);

  if (!email || !EMAIL_PATTERN.test(email)) {
    return null;
  }

  return `mailto:${email}`;
}

/** Digit WhatsApp yang sah (kode negara + nomor), tanpa spasi/tanda baca. */
export function whatsappDigits(value: string | null | undefined): string | null {
  const digits = (cleanText(value) ?? '').replace(/\D/g, '');

  return WHATSAPP_PATTERN.test(digits) ? digits : null;
}

export type ContactChannelKey = 'email' | 'whatsapp' | 'address';

export interface ContactChannel {
  key: ContactChannelKey;
  label: string;
  /** Teks yang ditampilkan apa adanya. */
  value: string;
  /** `null` untuk kanal yang tidak bisa ditautkan (alamat pos). */
  href: string | null;
}

/**
 * Kanal kontak yang boleh tampil. Field kosong atau tidak sah dibuang, jadi
 * halaman kontak tidak pernah menampilkan placeholder palsu.
 */
export function contactChannels(owner: SiteOwner = SITE_OWNER): ContactChannel[] {
  const channels: ContactChannel[] = [];
  const email = cleanText(owner.contactEmail);
  const emailHref = contactEmailHref(owner.contactEmail);

  if (email && emailHref) {
    channels.push({ key: 'email', label: 'Email', value: email, href: emailHref });
  }

  const digits = whatsappDigits(owner.contactWhatsapp);

  if (digits) {
    channels.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      value: `+${digits}`,
      href: `https://wa.me/${digits}`,
    });
  }

  const address = cleanText(owner.address);

  if (address) {
    channels.push({ key: 'address', label: 'Alamat', value: address, href: null });
  }

  return channels;
}

export interface LegalReviewStatus {
  /** `true` selama kebijakan belum ditinjau pihak berwenang. */
  isDraft: boolean;
  /** Tanggal tinjauan dalam format `YYYY-MM-DD`, atau `null`. */
  reviewedAt: string | null;
}

/** Status tinjauan kebijakan; tanggal yang tidak sah dianggap belum ditinjau. */
export function legalReviewStatus(owner: SiteOwner = SITE_OWNER): LegalReviewStatus {
  const raw = cleanText(owner.legalReviewedAt);

  if (!raw) {
    return { isDraft: true, reviewedAt: null };
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return { isDraft: true, reviewedAt: null };
  }

  return { isDraft: false, reviewedAt: parsed.toISOString().slice(0, 10) };
}

/**
 * Kalimat masa simpan data. Tanpa angka dari pemilik, teks tetap jujur:
 * belum ditetapkan, bukan menebak durasi.
 */
export function retentionLabel(owner: SiteOwner = SITE_OWNER): string {
  const days = owner.retentionDays;

  if (typeof days === 'number' && Number.isInteger(days) && days > 0) {
    return `Paling lama ${days} hari sejak data tidak lagi diperlukan untuk operasional situs.`;
  }

  return 'Belum ditetapkan pemilik situs. Data dipertahankan selama akun aktif dan selama diperlukan untuk operasional, keamanan, dan kewajiban hukum.';
}

/** Nama pengelola yang aman ditampilkan, atau `null`. */
export function managerName(owner: SiteOwner = SITE_OWNER): string | null {
  return cleanText(owner.managerName);
}
