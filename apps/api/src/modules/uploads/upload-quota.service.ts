import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RETENTION_MS = 2 * DAY_MS;

const QUOTA_MESSAGE =
  'Kuota unggah Anda sudah tercapai. Coba lagi nanti atau hubungi admin untuk kebutuhan mendesak.';

/**
 * Kuota presign per pengguna disimpan di database agar tidak hilang saat
 * instance API dimulai ulang. Admin bebas kuota harian dan memakai batas jam
 * yang lebih tinggi.
 */
@Injectable()
export class UploadQuotaService {
  private readonly logger = new Logger(UploadQuotaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assertAllowed(profile: AuthProfile): Promise<void> {
    const now = Date.now();
    const hourlyLimit =
      profile.role === 'ADMIN'
        ? this.config.get<number>('UPLOAD_QUOTA_ADMIN_PER_HOUR', 100)
        : this.config.get<number>('UPLOAD_QUOTA_PER_HOUR', 20);

    const hourlyCount = await this.prisma.uploadRequestLog.count({
      where: {
        profileId: profile.id,
        createdAt: { gte: new Date(now - HOUR_MS) },
      },
    });

    if (hourlyCount >= hourlyLimit) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: QUOTA_MESSAGE },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (profile.role === 'ADMIN') {
      return;
    }

    const dailyLimit = this.config.get<number>('UPLOAD_QUOTA_PER_DAY', 60);
    const dailyCount = await this.prisma.uploadRequestLog.count({
      where: {
        profileId: profile.id,
        createdAt: { gte: new Date(now - DAY_MS) },
      },
    });

    if (dailyCount >= dailyLimit) {
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: QUOTA_MESSAGE },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Dicatat setelah presign berhasil; pembersihan baris lama bersifat best-effort. */
  async record(profileId: string): Promise<void> {
    await this.prisma.uploadRequestLog.create({ data: { profileId } });

    try {
      await this.prisma.uploadRequestLog.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
      });
    } catch (error) {
      this.logger.warn(
        `Gagal membersihkan catatan unggahan lama: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
