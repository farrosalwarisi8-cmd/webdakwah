import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadMimeType, UploadRequest } from '@webdakwah/shared';

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
 * Satu-satunya tempat konfigurasi R2/S3. Presign dipakai editor, sedangkan
 * penghapusan dipakai alur konten. Penghapusan selalu best-effort: kegagalan
 * storage tidak boleh menggagalkan aksi utama.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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

  get isConfigured(): boolean {
    return this.settings !== null;
  }

  async createPresignedPut(profileId: string, input: UploadRequest) {
    if (!this.settings) {
      throw new ServiceUnavailableException(
        'Unggah media belum dikonfigurasi di server (R2_ACCOUNT_ID, kredensial, bucket, dan URL publik).',
      );
    }

    const extension = FILE_EXTENSIONS[input.contentType];
    const key = `media/${profileId}/${randomUUID()}.${extension}`;
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

  /**
   * Hapus objek hanya bila URL benar-benar milik bucket ini dan berada di
   * folder `media/<pemilik-konten>/`. URL eksternal atau folder pengguna lain
   * tidak pernah disentuh. Mengembalikan `true` bila penghapusan dikirim.
   */
  async deleteByPublicUrl(publicUrl: string, ownerId: string): Promise<boolean> {
    if (!this.settings) {
      return false;
    }

    const { publicBaseUrl, bucket, client } = this.settings;

    if (!publicUrl.startsWith(`${publicBaseUrl}/`)) {
      return false;
    }

    let key: string;

    try {
      key = new URL(publicUrl).pathname.replace(/^\/+/, '');
    } catch {
      return false;
    }

    if (!key.startsWith(`media/${ownerId}/`) || key.length <= `media/${ownerId}/`.length) {
      return false;
    }

    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

      return true;
    } catch (error) {
      this.logger.warn(
        `Gagal menghapus objek R2 "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return false;
    }
  }
}
