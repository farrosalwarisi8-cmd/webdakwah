import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { StorageService } from '../src/modules/storage/storage.service.js';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';

const CONFIGURED = {
  R2_ACCOUNT_ID: 'akun',
  R2_ACCESS_KEY_ID: 'kunci',
  R2_SECRET_ACCESS_KEY: 'rahasia',
  R2_BUCKET_NAME: 'webdakwah-media',
  R2_PUBLIC_BASE_URL: 'https://media.contoh.test/',
};

function createService(values: Record<string, string | undefined>) {
  const config = {
    get: vi.fn((key: string) => values[key]),
  };

  return new StorageService(config as unknown as ConfigService);
}

function clientSendMock(service: StorageService) {
  const settings = (
    service as unknown as {
      settings: { client: { send: ReturnType<typeof vi.fn> } } | null;
    }
  ).settings;

  if (!settings) {
    throw new Error('StorageService diuji tanpa konfigurasi.');
  }

  const send = vi.fn().mockResolvedValue({});
  settings.client.send = send;

  return send;
}

describe('StorageService — presign', () => {
  const getSignedUrlMock = vi.mocked(getSignedUrl);

  beforeEach(() => {
    getSignedUrlMock.mockReset();
    getSignedUrlMock.mockResolvedValue('https://upload.contoh.test/signed');
  });

  it('menolak presign saat konfigurasi R2 belum lengkap', async () => {
    const service = createService({ R2_ACCOUNT_ID: 'akun' });

    await expect(
      service.createPresignedPut(PROFILE_ID, { contentType: 'audio/mpeg', size: 1024 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('membuat URL unggah dengan kunci pada folder pengguna', async () => {
    const service = createService(CONFIGURED);

    const result = await service.createPresignedPut(PROFILE_ID, {
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

    const result = await service.createPresignedPut(PROFILE_ID, {
      contentType: 'video/webm',
      size: 1024,
    });

    expect(result.key.endsWith('.webm')).toBe(true);
  });
});

describe('StorageService — hapus objek', () => {
  it('menghapus objek yang berada di folder pemilik konten', async () => {
    const service = createService(CONFIGURED);
    const send = clientSendMock(service);

    const deleted = await service.deleteByPublicUrl(
      `https://media.contoh.test/media/${PROFILE_ID}/video.mp4`,
      PROFILE_ID,
    );

    expect(deleted).toBe(true);
    const command = send.mock.calls[0]?.[0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'webdakwah-media',
      Key: `media/${PROFILE_ID}/video.mp4`,
    });
  });

  it('mengabaikan URL eksternal dan folder pengguna lain', async () => {
    const service = createService(CONFIGURED);
    const send = clientSendMock(service);

    await expect(
      service.deleteByPublicUrl('https://cdn.lain.test/media/x/video.mp4', PROFILE_ID),
    ).resolves.toBe(false);
    await expect(
      service.deleteByPublicUrl(
        `https://media.contoh.test/media/${OTHER_ID}/video.mp4`,
        PROFILE_ID,
      ),
    ).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('tidak menggagalkan aksi saat storage error', async () => {
    const service = createService(CONFIGURED);
    const send = clientSendMock(service);
    send.mockRejectedValue(new Error('jaringan putus'));

    await expect(
      service.deleteByPublicUrl(
        `https://media.contoh.test/media/${PROFILE_ID}/video.mp4`,
        PROFILE_ID,
      ),
    ).resolves.toBe(false);
  });

  it('tidak menghapus apa pun bila R2 belum dikonfigurasi', async () => {
    const service = createService({});

    await expect(
      service.deleteByPublicUrl(
        `https://media.contoh.test/media/${PROFILE_ID}/video.mp4`,
        PROFILE_ID,
      ),
    ).resolves.toBe(false);
  });
});
