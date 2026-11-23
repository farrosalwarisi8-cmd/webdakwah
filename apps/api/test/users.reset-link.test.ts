import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetPasswordForEmail = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { resetPasswordForEmail } })),
}));

import { UsersService } from '../src/modules/users/users.service.js';
import type { PrismaService } from '../src/modules/prisma/prisma.service.js';

const USER_ID = '33333333-3333-4333-8333-333333333333';

const CONFIGURED = {
  SUPABASE_URL: 'https://project.contoh.test',
  SUPABASE_SERVICE_ROLE_KEY: 'kunci-server-tiruan',
  FRONTEND_ORIGINS: 'https://web.contoh.test,https://cadangan.contoh.test',
};

function createService(values: Record<string, string | undefined>, profile: unknown = null) {
  const prisma = {
    profile: { findUnique: vi.fn().mockResolvedValue(profile) },
  };
  const config = { get: vi.fn((key: string) => values[key]) };

  return {
    prisma,
    service: new UsersService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    ),
  };
}

describe('sendPasswordResetLink', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
  });

  it('mengirim tautan ke email pengguna dengan tujuan halaman pemulihan web', async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const { service } = createService(CONFIGURED, { email: 'pengguna@example.com' });

    await expect(service.sendPasswordResetLink(USER_ID)).resolves.toEqual({ ok: true });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('pengguna@example.com', {
      redirectTo: 'https://web.contoh.test/auth/pemulihan',
    });
  });

  it('menolak pengguna yang tidak ada tanpa mengirim email', async () => {
    const { service } = createService(CONFIGURED, null);

    await expect(service.sendPasswordResetLink(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('tersedia hanya bila kredensial server Supabase diisi', async () => {
    const { service } = createService(
      { FRONTEND_ORIGINS: 'https://web.contoh.test' },
      {
        email: 'pengguna@example.com',
      },
    );

    await expect(service.sendPasswordResetLink(USER_ID)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('menyamarkan galat Supabase menjadi pesan umum', async () => {
    resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: 'SMTP down: detail internal' },
    });
    const { service } = createService(CONFIGURED, { email: 'pengguna@example.com' });

    await expect(service.sendPasswordResetLink(USER_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
