import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchWithTimeout,
  isConnectingHintDue,
  RequestTimeoutError,
  retryDelayMs,
  shouldRetryStatus,
} from './resilience';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('aturan retry', () => {
  it('hanya mengulang gangguan sementara', () => {
    expect(shouldRetryStatus(502)).toBe(true);
    expect(shouldRetryStatus(503)).toBe(true);
    expect(shouldRetryStatus(504)).toBe(true);
    expect(shouldRetryStatus(401)).toBe(false);
    expect(shouldRetryStatus(404)).toBe(false);
    expect(shouldRetryStatus(500)).toBe(false);
  });

  it('memberi jeda bertingkat', () => {
    expect(retryDelayMs(0)).toBe(0);
    expect(retryDelayMs(1)).toBeLessThan(retryDelayMs(2));
  });

  it('menunda petunjuk menghubungkan sekitar empat detik', () => {
    expect(isConnectingHintDue(0, 3_999)).toBe(false);
    expect(isConnectingHintDue(0, 4_000)).toBe(true);
  });
});

describe('fetchWithTimeout', () => {
  it('mengembalikan respons pertama saat sukses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithTimeout('http://api.test/a');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mengulang 503 lalu mengembalikan respons sukses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('sibuk', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithTimeout('http://api.test/a', {}, { retries: 1 });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tidak mengulang 4xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('tidak ada', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithTimeout('http://api.test/a', {}, { retries: 2 });

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tidak mengulang POST walau 503', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('sibuk', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithTimeout(
      'http://api.test/a',
      { method: 'POST' },
      { retries: 2 },
    );

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mengubah timeout menjadi RequestTimeoutError', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('terlalu lama'), { name: 'TimeoutError' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithTimeout('http://api.test/a', {}, { retries: 0, timeoutMs: 5 }),
    ).rejects.toBeInstanceOf(RequestTimeoutError);
  });

  it('mengulang galat jaringan untuk GET lalu menyerah', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithTimeout('http://api.test/a', {}, { retries: 1 })).rejects.toThrow(
      'ECONNRESET',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
