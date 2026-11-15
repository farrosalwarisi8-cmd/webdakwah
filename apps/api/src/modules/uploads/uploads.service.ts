import { randomUUID } from 'node:crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadMimeType, UploadRequest } from '@webdakwah/shared';

import type { AuthProfile } from '../auth/auth.types.js';

const PRESIGN_EXPIRES_SEC = 600;

const FILE_EXTENSIONS: Record<UploadMimeType, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

interface StorageSettings {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
}

/**
 * Menerbitkan URL PUT sementara supaya browser mengunggah langsung ke R2.
 * Berkas tidak melewati API, jadi batas body 1 MB tetap aman.
 */
@Injectable()
export class UploadsService {
  private readonly settings: StorageSettings | null;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket = config.get<string>('R2_BUCKET_NAME');
    const publicBaseUrl = config.get<string>('R2_PUBLIC_BASE_URL');
    const customEndpoint = config.get<string>('R2_ENDPOINT');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      this.settings = null;
      return;
    }

    this.settings = {
      client: new S3Client({
        region: 'auto',
        endpoint: customEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`,
        // MinIO dan endpoint S3 kustom umumnya memakai path-style.
        forcePathStyle: Boolean(customEndpoint),
        credentials: { accessKeyId, secretAccessKey },
        // SDK baru menambahkan checksum CRC32 body kosong ke URL presign,
        // sehingga unggahan berkas asli bisa ditolak. Hanya hitung bila wajib.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      }),
      bucket,
      publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
    };
  }

  async createPresignedUpload(profile: AuthProfile, input: UploadRequest) {
    if (!this.settings) {
      throw new ServiceUnavailableException(
        'Unggah media belum dikonfigurasi di server (R2_ACCOUNT_ID, kredensial, bucket, dan URL publik).',
      );
    }

    const extension = FILE_EXTENSIONS[input.contentType];
    const key = `media/${profile.id}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.settings.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    });

    const uploadUrl = await getSignedUrl(this.settings.client, command, {
      expiresIn: PRESIGN_EXPIRES_SEC,
      // Jenis berkas ikut ditandatangani agar isi tidak bisa diganti tipenya.
      signableHeaders: new Set(['content-type']),
    });

    return {
      uploadUrl,
      publicUrl: `${this.settings.publicBaseUrl}/${key}`,
      key,
      expiresIn: PRESIGN_EXPIRES_SEC,
    };
  }
}
