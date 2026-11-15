import { createSupabaseServerClient } from '../supabase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: string | string[] } | null)?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message) {
    return message;
  }

  return 'Permintaan ke server gagal. Coba lagi.';
}

/**
 * Panggilan API dari Server Action/Server Component memakai token sesi yang
 * tersimpan di cookie; token tidak pernah dikirim ke JavaScript browser.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new ApiError(503, 'Autentikasi belum dikonfigurasi di server.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError(401, 'Sesi Anda sudah berakhir. Silakan masuk kembali.');
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  return (await response.json()) as T;
}
