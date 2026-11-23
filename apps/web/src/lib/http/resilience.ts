/**
 * Ketahanan panggilan HTTP dari server Next.js: batas waktu dan percobaan
 * ulang terbatas. Dipisah dari pemanggil agar bisa diuji tanpa jaringan.
 *
 * Aturan sengaja konservatif: gangguan sementara (jaringan mati, timeout,
 * 502/503/504) diulang; balasan 4xx tidak pernah diulang karena itu keputusan
 * server yang sah (401/403/404).
 */

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRIES = 2;

/** Ambang tampilan "Menghubungkan ke server…" agar pengguna tidak melihat form diam. */
export const CONNECTING_HINT_MS = 4_000;

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Server tidak merespons dalam ${timeoutMs / 1000} detik.`);
    this.name = 'RequestTimeoutError';
  }
}

export function shouldRetryStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

/** Jeda sebelum percobaan berikutnya; percobaan pertama tanpa jeda. */
export function retryDelayMs(attempt: number): number {
  return attempt <= 0 ? 0 : 400 * attempt + 100;
}

export function isConnectingHintDue(startedAt: number, now: number = Date.now()): boolean {
  return now - startedAt >= CONNECTING_HINT_MS;
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      error instanceof RequestTimeoutError)
  );
}

function canRetryRequest(init: RequestInit): boolean {
  const method = (init.method ?? 'GET').toUpperCase();

  return method === 'GET' || method === 'HEAD';
}

/** Batas waktu untuk pemanggilan non-fetch (mis. Supabase Auth di browser). */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new RequestTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface FetchWithTimeoutOptions {
  timeoutMs?: number;
  retries?: number;
  /** Sinyal dari pemanggil (mis. pembatalan saat komponen dilepas). */
  signal?: AbortSignal;
}

/**
 * `fetch` dengan batas waktu per percobaan dan retry terbatas. Respons 5xx yang
 * masih boleh diulang dikembalikan apa adanya setelah jatah habis agar pemanggil
 * tetap bisa membaca status dan pesan galat aslinya.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  options: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = Math.max(options.retries ?? DEFAULT_RETRIES, 0);
  const retryableRequest = canRetryRequest(init);

  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)));
    }

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    try {
      const response = await fetch(url, { ...init, signal });

      if (!retryableRequest || !shouldRetryStatus(response.status) || attempt === retries) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      if (isTimeoutError(error)) {
        lastError = new RequestTimeoutError(timeoutMs);
      } else {
        lastError = error;
      }

      if (!retryableRequest || attempt === retries) {
        throw lastError;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('Permintaan ke server gagal.');
}
