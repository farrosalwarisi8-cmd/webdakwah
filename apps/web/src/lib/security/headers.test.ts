import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PRIVATE_PATH_PREFIXES } from '../pwa';
import {
  buildContentSecurityPolicy,
  buildStaticContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  CONTENT_SECURITY_POLICY_REQUEST_HEADER,
  isPrivateRoute,
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_CSP_SOURCES,
  SECURITY_HEADERS,
  securityHeaders,
  staticContentSecurityPolicyHeaders,
} from './headers';

const NONCE = 'bm9uY2UtdGVzdA==';

function directive(policy: string, name: string): string | undefined {
  return policy
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));
}

describe('header keamanan statis', () => {
  it('memuat semua header yang dijanjikan', () => {
    const keys = SECURITY_HEADERS.map((header) => header.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-Frame-Options',
        'Permissions-Policy',
        'Cross-Origin-Opener-Policy',
      ]),
    );
  });

  it('tidak memakai HSTS preload dan tidak mengizinkan kamera/mikrofon', () => {
    const byKey = new Map(SECURITY_HEADERS.map((header) => [header.key, header.value]));

    expect(byKey.get('Strict-Transport-Security')).not.toContain('preload');
    expect(byKey.get('Permissions-Policy')).toContain('camera=()');
    expect(byKey.get('Permissions-Policy')).toContain('microphone=()');
    expect(byKey.get('X-Frame-Options')).toBe('DENY');
  });

  it('tidak menumpuk CSP statis (CSP per kelompok rute)', () => {
    expect(securityHeaders().map((header) => header.key)).not.toContain(
      CONTENT_SECURITY_POLICY_HEADER,
    );
  });
});

describe('CSP rute statis', () => {
  it('tanpa nonce dan tanpa strict-dynamic karena HTML dibuat saat build', () => {
    const policy = buildStaticContentSecurityPolicy();

    expect(policy).not.toContain('nonce-');
    expect(directive(policy, 'script-src')).not.toContain('strict-dynamic');
    expect(directive(policy, 'script-src')).toBe("script-src 'self' 'unsafe-inline'");
  });

  it('tetap menutup vektor dasar seperti kebijakan nonce', () => {
    const policy = buildStaticContentSecurityPolicy({ apiOrigin: 'https://api.test' });

    expect(directive(policy, 'default-src')).toBe("default-src 'self'");
    expect(directive(policy, 'object-src')).toBe("object-src 'none'");
    expect(directive(policy, 'base-uri')).toBe("base-uri 'self'");
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(policy, 'connect-src')).toContain('https://api.test');
  });

  it('hanya memakai unsafe-eval saat dev', () => {
    expect(directive(buildStaticContentSecurityPolicy({ isDev: true }), 'script-src')).toContain(
      "'unsafe-eval'",
    );
    expect(
      directive(buildStaticContentSecurityPolicy({ isDev: false }), 'script-src'),
    ).not.toContain("'unsafe-eval'");
  });

  it('mengirim header Report-Only untuk rute publik', () => {
    const [header] = staticContentSecurityPolicyHeaders();

    expect(header).toBeDefined();
    expect(header?.key).toBe(CONTENT_SECURITY_POLICY_HEADER);
    expect(header?.value).not.toContain('nonce-');
  });
});

describe('klasifikasi rute', () => {
  it('memakai daftar rute privat yang sama dengan cache offline', () => {
    expect([...PRIVATE_ROUTE_PREFIXES]).toEqual([...PRIVATE_PATH_PREFIXES]);
  });

  it('mengenali rute privat beserta turunannya, bukan hanya prefiks huruf', () => {
    expect(isPrivateRoute('/dashboard')).toBe(true);
    expect(isPrivateRoute('/dashboard/konten/baru')).toBe(true);
    expect(isPrivateRoute('/masuk')).toBe(true);
    expect(isPrivateRoute('/atur-sandi')).toBe(true);
    expect(isPrivateRoute('/dashboard-lain')).toBe(false);
    expect(isPrivateRoute('/')).toBe(false);
    expect(isPrivateRoute('/artikel/contoh')).toBe(false);
  });

  it('setiap halaman di src/app terklasifikasi tepat satu kali', () => {
    const pages = listPageRoutes();

    // Jaga tes ini sendiri: bila direktori tidak terbaca, jangan lulus diam-diam.
    expect(pages.length).toBeGreaterThan(20);

    for (const route of pages) {
      const sample = route.replace(/\[[^/]+\]/g, 'contoh');
      const sources = [
        isPrivateRoute(sample),
        PUBLIC_CSP_SOURCES.some((source) => sourceToRegExp(source).test(sample)),
      ].filter(Boolean).length;

      expect(
        sources,
        `${route} harus mendapat CSP dari proxy (privat) atau next.config (publik), bukan keduanya`,
      ).toBe(1);
    }
  });
});

/** Semua rute halaman (tanpa `page.tsx`) di `src/app`, mis. `/artikel/[slug]`. */
function listPageRoutes(): string[] {
  const appDir = fileURLToPath(new URL('../../app', import.meta.url));

  return readdirSync(appDir, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.split(/[\\/]/).at(-1) === 'page.tsx')
    .map((entry) => {
      const segments = entry.split(/[\\/]/).slice(0, -1);

      return segments.length === 0 ? '/' : `/${segments.join('/')}`;
    });
}

/**
 * Ubah pola `source` Next (`:path*`, `:path`) menjadi regex untuk pengujian.
 * Sama seperti path-to-regexp, `:path*` boleh cocok tanpa segmen tambahan,
 * sehingga `/artikel/:path*` juga mencakup `/artikel`.
 */
function sourceToRegExp(source: string): RegExp {
  const segments = source.split('/').filter(Boolean);

  if (segments.length === 0) {
    return /^\/$/;
  }

  const pattern = segments
    .map((segment) => {
      if (segment === ':path*') {
        return '(?:/[^/]+)*';
      }

      if (segment === ':path') {
        return '/[^/]+';
      }

      return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    })
    .join('');

  return new RegExp(`^${pattern}$`);
}

describe('buildContentSecurityPolicy', () => {
  it('mengirim kebijakan sebagai Report-Only lebih dulu', () => {
    expect(CONTENT_SECURITY_POLICY_HEADER).toBe('Content-Security-Policy-Report-Only');
    expect(CONTENT_SECURITY_POLICY_HEADER).not.toBe('Content-Security-Policy');
  });

  it('memakai header permintaan biasa agar Next menemukan nonce', () => {
    expect(CONTENT_SECURITY_POLICY_REQUEST_HEADER).toBe('Content-Security-Policy');
  });

  it('menolak CSP tanpa nonce agar script Next tidak ikut diblokir', () => {
    expect(() => buildContentSecurityPolicy({ nonce: '' })).toThrow(/nonce/i);
  });

  it('menutup vektor dasar', () => {
    const policy = buildContentSecurityPolicy({ nonce: NONCE });

    expect(directive(policy, 'default-src')).toBe("default-src 'self'");
    expect(directive(policy, 'object-src')).toBe("object-src 'none'");
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(policy, 'base-uri')).toBe("base-uri 'self'");
    expect(directive(policy, 'form-action')).toBe("form-action 'self'");
  });

  it('mengizinkan script Next lewat nonce + strict-dynamic, tanpa unsafe-inline', () => {
    const scriptSrc = directive(buildContentSecurityPolicy({ nonce: NONCE }), 'script-src') ?? '';

    expect(scriptSrc).toContain(`'nonce-${NONCE}'`);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('mengizinkan iframe video hanya dari penyedia yang didukung', () => {
    const frameSrc = directive(buildContentSecurityPolicy({ nonce: NONCE }), 'frame-src') ?? '';

    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain('https://www.youtube-nocookie.com');
    expect(frameSrc).toContain('https://www.tiktok.com');
    expect(frameSrc).toContain('https://www.instagram.com');
    expect(frameSrc).not.toContain('https://www.youtube.com');
  });

  it('masih mengizinkan style inline karena komponen memakai atribut style', () => {
    const styleSrc = directive(buildContentSecurityPolicy({ nonce: NONCE }), 'style-src') ?? '';

    expect(styleSrc).toContain("'unsafe-inline'");
  });

  it('mengizinkan Supabase untuk REST dan realtime', () => {
    const policy = buildContentSecurityPolicy({ nonce: NONCE });

    expect(directive(policy, 'connect-src')).toContain('https://*.supabase.co');
    expect(directive(policy, 'connect-src')).toContain('wss://*.supabase.co');
  });

  it('menambahkan origin API yang dipanggil browser, tanpa path', () => {
    const policy = buildContentSecurityPolicy({
      nonce: NONCE,
      apiOrigin: 'https://api.webdakwah.test/api',
    });
    const values = directive(policy, 'connect-src')?.split(' ') ?? [];

    expect(values).toContain('https://api.webdakwah.test');
    expect(values).not.toContain('https://api.webdakwah.test/api');
  });

  it('mengabaikan origin API yang kosong atau tidak http(s)', () => {
    for (const apiOrigin of [undefined, '', 'bukan-url', 'javascript:alert(1)']) {
      const policy = buildContentSecurityPolicy({ nonce: NONCE, apiOrigin });

      expect(directive(policy, 'connect-src')).toBe(
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      );
    }
  });

  it('hanya memakai unsafe-eval saat dev', () => {
    expect(
      directive(buildContentSecurityPolicy({ nonce: NONCE, isDev: true }), 'script-src'),
    ).toContain("'unsafe-eval'");
    expect(
      directive(buildContentSecurityPolicy({ nonce: NONCE, isDev: false }), 'script-src'),
    ).not.toContain("'unsafe-eval'");
  });

  it('menambahkan report-uri hanya bila endpoint diberikan', () => {
    expect(directive(buildContentSecurityPolicy({ nonce: NONCE }), 'report-uri')).toBeUndefined();
    expect(
      directive(
        buildContentSecurityPolicy({ nonce: NONCE, reportUri: 'https://lapor.test/csp' }),
        'report-uri',
      ),
    ).toBe('report-uri https://lapor.test/csp');
  });
});
