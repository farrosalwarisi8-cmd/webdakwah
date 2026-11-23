/**
 * Header keamanan web.
 *
 * Header statis dipasang lewat `next.config.ts` untuk semua rute. CSP dibangun
 * per permintaan di `src/proxy.ts` karena memakai nonce: Next.js membaca nonce
 * dari header CSP pada permintaan, lalu menempelkannya ke script yang ia render.
 * Konsekuensinya halaman harus dinamis (lihat `dynamic = 'force-dynamic'` di root
 * layout), sehingga nonce-nya cocok dengan HTML yang dikirim.
 *
 * Kebijakan dikirim dalam mode Report-Only: pelanggaran dicatat dan dilaporkan,
 * tetapi belum memblokir permintaan. Setelah laporan bersih dan disetujui pemilik,
 * penegakan cukup mengganti header respons menjadi `Content-Security-Policy`.
 *
 * `style-src` sengaja masih memakai `'unsafe-inline'`: komponen memakai atribut
 * `style` untuk progres pemutar audio dan tinggi kartu. `script-src` memakai
 * nonce + `strict-dynamic` tanpa `'unsafe-inline'` sebagai jalur utama XSS.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

export const SECURITY_HEADERS: readonly SecurityHeader[] = [
  // Lanjutkan HTTPS di peramban. `preload` sengaja tidak dipakai karena sulit dibatalkan.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

export interface CspOptions {
  /** Nonce per permintaan; wajib, karena CSP tanpa nonce akan memblokir script Next. */
  nonce: string;
  /** Saat dev, React Refresh membutuhkan eval; jangan pernah aktif di produksi. */
  isDev?: boolean;
  /** Endpoint pengumpul laporan CSP; kosong berarti laporan hanya ke konsol. */
  reportUri?: string;
  /**
   * Origin API yang dipanggil langsung dari browser (mis. tombol ikuti siaran).
   * Path diabaikan; nilai yang bukan http/https diabaikan.
   */
  apiOrigin?: string;
}

function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function buildContentSecurityPolicy({
  nonce,
  isDev = false,
  reportUri,
  apiOrigin,
}: CspOptions): string {
  if (!nonce) {
    throw new Error('CSP nonce wajib diisi');
  }

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ];
  const connectSrc = ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'];
  const api = normalizeOrigin(apiOrigin);

  if (api) {
    connectSrc.push(api);
  }

  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    ['base-uri', ["'self'"]],
    ['object-src', ["'none'"]],
    ['frame-ancestors', ["'none'"]],
    ['form-action', ["'self'"]],
    ['script-src', scriptSrc],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['font-src', ["'self'", 'data:']],
    ['img-src', ["'self'", 'data:', 'blob:', 'https:']],
    ['media-src', ["'self'", 'blob:', 'https:']],
    ['manifest-src', ["'self'"]],
    ['worker-src', ["'self'"]],
    // Iframe video yang dikenali `getVideoEmbed` (YouTube, TikTok, Instagram).
    [
      'frame-src',
      [
        "'self'",
        'https://www.youtube-nocookie.com',
        'https://www.tiktok.com',
        'https://www.instagram.com',
      ],
    ],
    // Supabase Auth/REST (https), kanal realtime (wss), dan API webdakwah.
    ['connect-src', connectSrc],
  ];

  if (reportUri) {
    directives.push(['report-uri', [reportUri]]);
  }

  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

/** Header keamanan statis untuk semua rute (tanpa CSP; CSP dipasang proxy). */
export function securityHeaders(): SecurityHeader[] {
  return [...SECURITY_HEADERS];
}

/**
 * Header CSP yang dikirim ke browser. Masih **Report-Only**: pelanggaran dilaporkan
 * (konsol atau `CSP_REPORT_URI`) tetapi tidak memblokir apa pun. Beralih ke penegakan
 * hanya dengan mengubah nilai ini menjadi `'Content-Security-Policy'` setelah laporan
 * bersih dan disetujui pemilik.
 */
export const CONTENT_SECURITY_POLICY_HEADER = 'Content-Security-Policy-Report-Only';

/**
 * CSP pada *permintaan* (internal, tidak sampai ke browser). Next.js membaca nonce
 * dari header ini lalu menempelkannya ke script yang ia render, sehingga nonce pada
 * HTML cocok dengan kebijakan. Header respons tetap Report-Only.
 */
export const CONTENT_SECURITY_POLICY_REQUEST_HEADER = 'Content-Security-Policy';
