import { describe, expect, it } from 'vitest';

import { SlidingWindowLimiter } from './rate-limit';

const WINDOW = 60_000;

describe('SlidingWindowLimiter', () => {
  it('mengizinkan sampai batas lalu menolak', () => {
    const limiter = new SlidingWindowLimiter(2, WINDOW);

    expect(limiter.check('ip', 0).allowed).toBe(true);
    expect(limiter.check('ip', 1_000).allowed).toBe(true);
    expect(limiter.check('ip', 2_000)).toEqual({
      allowed: false,
      retryAfterMs: 58_000,
    });
  });

  it('memulihkan jatah setelah jendela lewat', () => {
    const limiter = new SlidingWindowLimiter(1, WINDOW);
    limiter.check('ip', 0);

    expect(limiter.check('ip', WINDOW).allowed).toBe(true);
  });

  it('memisahkan kunci per pengguna', () => {
    const limiter = new SlidingWindowLimiter(1, WINDOW);

    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('b', 0).allowed).toBe(true);
    expect(limiter.check('a', 0).allowed).toBe(false);
  });
});
