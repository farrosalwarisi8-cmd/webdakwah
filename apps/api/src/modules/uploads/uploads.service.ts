import { Injectable } from '@nestjs/common';
import type { UploadRequest } from '@webdakwah/shared';

import type { AuthProfile } from '../auth/auth.types.js';
import { StorageService } from '../storage/storage.service.js';
import { UploadQuotaService } from './upload-quota.service.js';

/**
 * Menerbitkan URL PUT sementara supaya browser mengunggah langsung ke R2.
 * Berkas tidak melewati API, jadi batas body 1 MB tetap aman.
 */
@Injectable()
export class UploadsService {
  constructor(
    private readonly storage: StorageService,
    private readonly quota: UploadQuotaService,
  ) {}

  async createPresignedUpload(profile: AuthProfile, input: UploadRequest) {
    await this.quota.assertAllowed(profile);

    const result = await this.storage.createPresignedPut(profile.id, input);
    await this.quota.record(profile.id);

    return result;
  }
}
