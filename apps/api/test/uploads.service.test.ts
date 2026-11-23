import { HttpException } from '@nestjs/common';
import { uploadRequestSchema } from '@webdakwah/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthProfile } from '../src/modules/auth/auth.types.js';
import type { StorageService } from '../src/modules/storage/storage.service.js';
import type { UploadQuotaService } from '../src/modules/uploads/upload-quota.service.js';
import { UploadsService } from '../src/modules/uploads/uploads.service.js';

const profile: AuthProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@uji.local',
  fullName: 'Admin Uji',
  role: 'ADMIN',
  isActive: true,
  accountStatus: 'APPROVED',
};

const PRESIGNED = {
  uploadUrl: 'https://upload.contoh.test/signed',
  publicUrl: `https://media.contoh.test/media/${profile.id}/berkas.mp3`,
  key: `media/${profile.id}/berkas.mp3`,
  expiresIn: 600,
};

function createService() {
  const storage = {
    createPresignedPut: vi.fn().mockResolvedValue(PRESIGNED),
  };
  const quota = {
    assertAllowed: vi.fn().mockResolvedValue(undefined),
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    storage,
    quota,
    service: new UploadsService(
      storage as unknown as StorageService,
      quota as unknown as UploadQuotaService,
    ),
  };
}

describe('UploadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('memeriksa kuota sebelum presign lalu mencatatnya', async () => {
    const { quota, service } = createService();

    const result = await service.createPresignedUpload(profile, {
      contentType: 'audio/mpeg',
      size: 2048,
    });

    expect(result).toEqual(PRESIGNED);
    expect(quota.assertAllowed).toHaveBeenCalledWith(profile);
    expect(quota.record).toHaveBeenCalledWith(profile.id);
    expect(quota.assertAllowed.mock.invocationCallOrder[0]).toBeLessThan(
      quota.record.mock.invocationCallOrder[0]!,
    );
  });

  it('tidak membuat URL saat kuota habis', async () => {
    const { quota, storage, service } = createService();
    quota.assertAllowed.mockRejectedValue(new HttpException('Kuota habis.', 429));

    await expect(
      service.createPresignedUpload(profile, { contentType: 'audio/mpeg', size: 1024 }),
    ).rejects.toMatchObject({ status: 429 });
    expect(storage.createPresignedPut).not.toHaveBeenCalled();
    expect(quota.record).not.toHaveBeenCalled();
  });

  it('tidak mencatat kuota bila presign gagal', async () => {
    const { quota, storage, service } = createService();
    storage.createPresignedPut.mockRejectedValue(new Error('R2 belum diatur'));

    await expect(
      service.createPresignedUpload(profile, { contentType: 'audio/mpeg', size: 1024 }),
    ).rejects.toThrow('R2 belum diatur');
    expect(quota.record).not.toHaveBeenCalled();
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

  it('menerima gambar sampai 5 MB dan menolak gambar yang lebih besar', () => {
    const image = uploadRequestSchema.safeParse({
      contentType: 'image/webp',
      size: 5 * 1024 * 1024,
    });
    const terlaluBesar = uploadRequestSchema.safeParse({
      contentType: 'image/png',
      size: 5 * 1024 * 1024 + 1,
    });

    expect(image.success).toBe(true);
    expect(terlaluBesar.success).toBe(false);
  });
});
