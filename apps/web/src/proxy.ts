import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  CONTENT_SECURITY_POLICY_REQUEST_HEADER,
} from '@/lib/security/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Heksadesimal adalah base64-value yang sah dan tidak butuh Buffer (aman di
  // runtime Node maupun Edge).
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function withPolicy(response: NextResponse, policy: string): NextResponse {
  response.headers.set(CONTENT_SECURITY_POLICY_HEADER, policy);
  return response;
}

/**
 * Memasang CSP nonce untuk semua halaman, lalu (khusus /dashboard) menyegarkan
 * sesi Supabase dan menjaga rute. Proxy hanya lapisan kenyamanan; API tetap
 * memverifikasi token di setiap rute.
 */
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    reportUri: process.env.CSP_REPORT_URI,
    apiOrigin: process.env.NEXT_PUBLIC_API_URL,
  });

  // Next.js membaca nonce dari header permintaan ini dan menempelkannya ke
  // script yang ia render. Header respons tetap Report-Only, jadi browser tidak
  // memblokir apa pun sampai kebijakan ini disetujui untuk ditegakkan.
  request.headers.set('x-nonce', nonce);
  request.headers.set(CONTENT_SECURITY_POLICY_REQUEST_HEADER, policy);

  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return withPolicy(NextResponse.next({ request }), policy);
  }

  const config = getSupabaseConfig();

  if (!config) {
    return withPolicy(NextResponse.next({ request }), policy);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = '';
    url.searchParams.set('next', request.nextUrl.pathname);

    return withPolicy(NextResponse.redirect(url), policy);
  }

  return withPolicy(response, policy);
}

export const config = {
  matcher: [
    /*
     * Semua halaman (agar CSP nonce ikut), kecuali aset statis, API, dan
     * permintaan prefetch yang tidak merender HTML.
     */
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
