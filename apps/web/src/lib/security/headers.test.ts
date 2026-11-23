import { describe, expect, it } from 'vitest';

import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  CONTENT_SECURITY_POLICY_REQUEST_HEADER,
  SECURITY_HEADERS,
  securityHeaders,
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

  it('tidak menumpuk CSP statis (CSP dipasang proxy)', () => {
    expect(securityHeaders().map((header) => header.key)).not.toContain(
      CONTENT_SECURITY_POLICY_HEADER,
    );
  });
});

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
