import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { paginationQuerySchema, type PaginationQuery } from '@webdakwah/shared';

import { CurrentProfile, Public, Roles } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { readLimit, THROTTLE_TTL_MS } from '../throttling/throttling.js';
import { BroadcastWatchingService } from './broadcast-watching.service.js';

function parsePaginationQuery(query: unknown): PaginationQuery {
  const parsed = paginationQuerySchema.safeParse(query);
  if (!parsed.success) throw new BadRequestException('Parameter halaman tidak valid.');
  return parsed.data;
}

@Controller('broadcast')
@Throttle({
  default: { limit: () => readLimit('THROTTLE_LIVE_PER_MIN', 60), ttl: THROTTLE_TTL_MS },
})
export class BroadcastWatchingController {
  constructor(private readonly watching: BroadcastWatchingService) {}

  /** Publik: berapa orang yang mengikuti channel ini (tanpa data pengguna). */
  @Public()
  @Get('public/:channelId/watching-count')
  async publicWatchCount(@Param('channelId', ParseUUIDPipe) channelId: string) {
    return { watcherCount: await this.watching.watchingCount(channelId) };
  }

  /** Status ikut-siaran pengguna yang sedang login. */
  @Get('watch/:channelId')
  status(
    @CurrentProfile() profile: AuthProfile,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ) {
    return this.watching.status(profile, channelId);
  }

  @Post('watch/:channelId')
  watch(
    @CurrentProfile() profile: AuthProfile,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ) {
    return this.watching.watch(profile, channelId);
  }

  @Delete('watch/:channelId')
  unwatch(
    @CurrentProfile() profile: AuthProfile,
    @Param('channelId', ParseUUIDPipe) channelId: string,
  ) {
    return this.watching.unwatch(profile, channelId);
  }

  /** Dashboard admin: daftar pengikut satu channel. */
  @Roles('ADMIN')
  @Get('manage/watchers/:channelId')
  listWatchers(
    @CurrentProfile() profile: AuthProfile,
    @Param('channelId', ParseUUIDPipe) channelId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const { page, pageSize } = parsePaginationQuery(query);
    return this.watching.listWatchers(profile, channelId, page, pageSize);
  }
}
