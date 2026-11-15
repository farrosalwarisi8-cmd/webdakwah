import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { uploadRequestSchema } from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import { UploadsService } from '../src/modules/uploads/uploads.service.js';

const profile: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@uji.local',
  fullName: 'Admin Uji',
  role: 'ADMIN',
  isActive: true,
};

const CONFIGURED = {
  R2_ACCOUNT_ID: 'akun',
  R2_ACCESS_KEY_ID: 'kunci',
  R2_SECRET_ACCESS_KEY: 'rahasia',
  R2_BUCKET_NAME: 'webdakwah-media',
  R2_PUBLIC_BASE_URL: 'https://media.contoh.test',
};

function createService(values: Record<string, string | undefined>) {
  const config = {
    get: vi.fn((key: string) => values[key]),
  };

  return new UploadsService(config as unknown as ConfigService);
}

describe('UploadsService', () => {
  const getSignedUrlMock = vi.mocked(getSignedUrl);

  beforeEach(() => {
    getSignedUrlMock.mockReset();
    getSignedUrlMock.mockResolvedValue('https://upload.contoh.test/signed');
  });

  it('menolak presign saat konfigurasi R2 belum lengkap', async () => {
    const service = createService({ R2_ACCOUNT_ID: 'akun' });

    await expect(
      service.createPresignedUpload(profile, { contentType: 'audio/mpeg', size: 1024 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('membuat URL unggah dengan kunci pada folder pengguna', async () => {
    const service = createService(CONFIGURED);

    const result = await service.createPresignedUpload(profile, {
      contentType: 'audio/mpeg',
      size: 2048,
    });

    expect(result.publicUrl).toMatch(
      /^https:\/\/media\.contoh\.test\/media\/11111111-1111-4111-8111-111111111111\/[0-9a-f-]+\.mp3$/,
    );
    expect(result).toMatchObject({
      uploadUrl: 'https://upload.contoh.test/signed',
      expiresIn: 600,
    });

    const command = getSignedUrlMock.mock.calls[0]?.[1] as {
      input: Record<string, unknown>;
    };

    expect(command.input).toMatchObject({
      Bucket: 'webdakwah-media',
      ContentType: 'audio/mpeg',
      ContentLength: 2048,
    });
    expect(command.input.Key).toBe(result.key);
    expect(getSignedUrlMock).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      expiresIn: 600,
      signableHeaders: new Set(['content-type']),
    });
  });

  it('memakai ekstensi video yang sesuai', async () => {
    const service = createService(CONFIGURED);

    const result = await service.createPresignedUpload(profile, {
      contentType: 'video/webm',
      size: 1024,
    });

    expect(result.key.endsWith('.webm')).toBe(true);
  });
});

describe('uploadRequestSchema', () => {
  it('menolak audio di atas 50 MB dan menerima video 50 MB', () => {
    const audio = uploadRequestSchema.safeParse({
      contentType: 'audio/mpeg',
      size: 51 * 1024 * 1024,
    });
    const video = uploadRequestSchema.safeParse({
      contentType: 'video/mp4',
      size: 50 * 1024 * 1024,
    });

    expect(audio.success).toBe(false);
    expect(video.success).toBe(true);
  });
});
