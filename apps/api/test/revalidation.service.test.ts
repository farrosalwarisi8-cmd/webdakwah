import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RevalidationService } from '../src/modules/revalidation/revalidation.service.js';

function createService(values: Record<string, string | undefined>) {
  const config = {
    get: vi.fn((key: string) => values[key]),
  };

  return new RevalidationService(config as unknown as ConfigService);
}

describe('RevalidationService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tidak memanggil webhook saat env belum diisi', async () => {
    const service = createService({});

    await service.trigger();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mengirim POST dengan header rahasia saat env lengkap', async () => {
    const service = createService({
      FRONTEND_REVALIDATE_URL: 'http://localhost:3000/api/revalidate',
      REVALIDATE_SECRET: 'rahasia-uji-yang-cukup-panjang',
    });

    await service.trigger();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'x-revalidate-secret': 'rahasia-uji-yang-cukup-panjang' },
      }),
    );
  });

  it('menelan kegagalan webhook agar aksi admin tetap berhasil', async () => {
    fetchMock.mockRejectedValue(new Error('koneksi ditolak'));
    const service = createService({
      FRONTEND_REVALIDATE_URL: 'http://localhost:3000/api/revalidate',
      REVALIDATE_SECRET: 'rahasia-uji-yang-cukup-panjang',
    });

    await expect(service.trigger()).resolves.toBeUndefined();
  });
});
