/**
 * Header keamanan web.
 *
 * Header statis dipasang lewat `next.config.ts` untuk semua rute. CSP punya dua
 * jalur, dipilih menurut sifat rutenya:
 *
 * - **Rute publik** (`/`, artikel, audio, video, halaman info, dst.) dirender
 *   statis/ISR agar bisa di-cache CDN. HTML-nya dibuat saat build, ketika belum
 *   ada permintaan yang membawa nonce, jadi kebijakannya tanpa nonce dan dipasang
 *   statis dari `PUBLIC_CSP_SOURCES` di `next.config.ts`.
 * - **Rute privat** (`/dashboard`, masuk, daftar, akun, lupa/atur sandi, auth)
 *   selalu dirender per permintaan dan memakai CSP nonce + `strict-dynamic` yang
 *   dibangun di `src/proxy.ts`.
 *
 * Kebijakan dikirim dalam mode Report-Only: pelanggaran dicatat dan dilaporkan,
 * tetapi belum memblokir permintaan. Setelah laporan bersih dan disetujui pemilik,
 * penegakan cukup mengganti header respons menjadi `Content-Security-Policy`.
 *
 * `style-src` sengaja masih memakai `'unsafe-inline'`: komponen memakai atribut
 * `style` untuk progres pemutar audio dan tinggi kartu. Pada rute privat
 * `script-src` memakai nonce tanpa `'unsafe-inline'` sebagai jalur utama XSS;
 * pada rute statis nonce tidak mungkin dipakai, sehingga `'unsafe-inline'`
 * diperlukan untuk script inline Next (`self.__next_f`).
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

/** Pilihan CSP untuk rute statis: sama, tanpa nonce. */
export type StaticCspOptions = Omit<CspOptions, 'nonce'>;

/**
 * Prefiks rute privat. Harus sama dengan daftar di `lib/pwa.ts` (dijaga oleh tes):
 * halaman ini memuat data pribadi, dirender per permintaan, dan memakai CSP nonce.
 */
export const PRIVATE_ROUTE_PREFIXES = [
  '/dashboard',
  '/masuk',
  '/daftar',
  '/akun',
  '/auth',
  '/api',
  '/lupa-sandi',
  '/atur-sandi',
] as const;

/** Benar bila pathname termasuk rute privat (CSP nonce, tidak di-cache). */
export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Daftar rute publik yang dikenal. `next.config.ts` memasang CSP statis lewat pola
 * negatif "bukan rute privat" (sehingga halaman 404 di path mana pun ikut tercakup);
 * daftar ini menjadi inventaris dan dipakai tes untuk memastikan setiap `page.tsx`
 * di `src/app` terklasifikasi tepat satu kali.
 */
export const PUBLIC_CSP_SOURCES = [
  '/',
  '/artikel/:path*',
  '/audio/:path*',
  '/video/:path*',
  '/kategori/:path*',
  '/tag/:path*',
  '/penceramah/:path*',
  '/rujukan/:path*',
  '/cari',
  '/siaran',
  '/tentang',
  '/privasi',
  '/syarat',
  '/kontak',
  '/simpanan',
  '/offline',
] as const;

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

function buildPolicy({
  scriptSrc,
  reportUri,
  apiOrigin,
}: {
  scriptSrc: string[];
  reportUri?: string;
  apiOrigin?: string;
}): string {
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

export function buildContentSecurityPolicy({
  nonce,
  isDev = false,
  reportUri,
  apiOrigin,
}: CspOptions): string {
  if (!nonce) {
    throw new Error('CSP nonce wajib diisi');
  }

  return buildPolicy({
    scriptSrc: [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    reportUri,
    apiOrigin,
  });
}

/**
 * CSP untuk HTML statis/ISR. Nonce mustahil dipakai karena HTML dibuat saat build,
 * jadi script inline Next hanya bisa diizinkan lewat `'unsafe-inline'`. Kelemahan
 * ini tertutup oleh `object-src 'none'`, `base-uri 'self'`, dan `frame-ancestors
 * 'none'`, serta tetap Report-Only sampai pemilik menyetujui penegakan.
 */
export function buildStaticContentSecurityPolicy({
  isDev = false,
  reportUri,
  apiOrigin,
}: StaticCspOptions = {}): string {
  return buildPolicy({
    scriptSrc: ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    reportUri,
    apiOrigin,
  });
}

/** Header CSP untuk rute publik, dipasang lewat `next.config.ts`. */
export function staticContentSecurityPolicyHeaders(): SecurityHeader[] {
  return [
    {
      key: CONTENT_SECURITY_POLICY_HEADER,
      value: buildStaticContentSecurityPolicy({
        isDev: process.env.NODE_ENV === 'development',
        reportUri: process.env.CSP_REPORT_URI,
        apiOrigin: process.env.NEXT_PUBLIC_API_URL,
      }),
    },
  ];
}

/**
 * Header keamanan statis untuk semua rute, tanpa CSP: CSP per kelompok rute
 * dipasang di `next.config.ts` (publik) dan `src/proxy.ts` (privat).
 */
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
