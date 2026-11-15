import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Memberi tahu web bahwa konten publik berubah, supaya cache 60 detik tidak
 * membuat konten terbit/arsip tertinggal. Kegagalan webhook tidak boleh
 * menggagalkan aksi admin — cache akan kedaluwarsa sendiri.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  async trigger(): Promise<void> {
    const url = this.config.get<string>('FRONTEND_REVALIDATE_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');

    if (!url || !secret) {
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'x-revalidate-secret': secret },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        this.logger.warn(`Revalidasi web gagal: HTTP ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Tidak bisa memicu revalidasi web: ${message}`);
    }
  }
}
