/**
 * Pembatas laju sederhana berbasis jendela geser untuk aksi sensitif di web
 * (mis. permintaan tautan pemulihan sandi).
 *
 * Catatan jujur: penyimpanan ada di memori proses. Di serverless dengan banyak
 * instance, batas ini hanya berlaku per instance — Supabase tetap membatasi
 * pengiriman email, jadi ini lapisan tambahan, bukan satu-satunya.
 */

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

const MAX_TRACKED_KEYS = 1000;

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now: number = Date.now()): RateLimitDecision {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);

      return {
        allowed: false,
        retryAfterMs: Math.max((recent[0] ?? now) + this.windowMs - now, 0),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);

    if (this.hits.size > MAX_TRACKED_KEYS) {
      this.sweep(cutoff);
    }

    return { allowed: true, retryAfterMs: 0 };
  }

  reset(): void {
    this.hits.clear();
  }

  private sweep(cutoff: number): void {
    for (const [key, timestamps] of this.hits) {
      if (timestamps.every((timestamp) => timestamp <= cutoff)) {
        this.hits.delete(key);
      }
    }
  }
}

/** Batas permintaan tautan pemulihan sandi: 5 kali per 15 menit per IP. */
export const PASSWORD_RESET_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 } as const;
