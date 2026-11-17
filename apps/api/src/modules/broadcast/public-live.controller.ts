import { Controller, Get, Header } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../auth/auth.decorators.js';
import { readLimit, THROTTLE_TTL_MS } from '../throttling/throttling.js';
import { BroadcastService } from './broadcast.service.js';

/**
 * Informasi siaran untuk pengunjung. Hanya memuat alamat dengar publik dan
 * jadwal aktif; statusUrl dan data internal tidak pernah dikirim.
 */
@Public()
@Throttle({
  default: { limit: () => readLimit('THROTTLE_LIVE_PER_MIN', 120), ttl: THROTTLE_TTL_MS },
})
@Controller('public')
export class PublicLiveController {
  constructor(private readonly broadcast: BroadcastService) {}

  @Get('live')
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
  live() {
    return this.broadcast.getPublicLive();
  }
}
