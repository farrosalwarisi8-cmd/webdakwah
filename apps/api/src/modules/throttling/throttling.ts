/**
 * Utilitas rate limiting. Nilai dibaca saat request berjalan supaya `.env`
 * yang dimuat ConfigModule sudah tersedia, dengan default yang sama seperti
 * skema env.
 */

export const THROTTLE_TTL_MS = 60_000;

export function readLimit(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  const value = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

interface TrackerRequest {
  user?: { id?: string };
  ip?: string;
}

/**
 * Endpoint terautentikasi dihitung per pengguna (bukan IP bersama server
 * Next.js/Vercel), endpoint publik memakai IP sebagai kunci anti-banjir.
 */
export function resolveThrottleTracker(request: TrackerRequest): string {
  const userId = request.user?.id?.trim();

  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${request.ip?.trim() || 'tidak-diketahui'}`;
}
