import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  publicContentQuerySchema,
  publicLatestQuerySchema,
  publicSearchQuerySchema,
  type PublicContentQuery,
  type PublicSearchQuery,
} from '@webdakwah/shared';

import { Public } from '../auth/auth.decorators.js';
import { readLimit, THROTTLE_TTL_MS } from '../throttling/throttling.js';
import { PublicContentsService } from './public-contents.service.js';

function parseQuery(query: unknown): PublicContentQuery {
  const parsed = publicContentQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter daftar konten tidak valid.');
  }

  return parsed.data;
}

function parseSearchQuery(query: unknown): PublicSearchQuery {
  const parsed = publicSearchQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter pencarian tidak valid.');
  }

  return parsed.data;
}

function parseLatestQuery(query: unknown): { limit: number } {
  const parsed = publicLatestQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter konten terbaru tidak valid.');
  }

  return parsed.data;
}

/**
 * Rute baca publik: hanya konten berstatus PUBLISHED yang pernah keluar.
 * Batasnya longgar (anti-banjir) dan tiap handler punya penghitung sendiri,
 * jadi pencarian tidak menghabiskan kuota daftar/beranda.
 */
@Public()
@Throttle({
  default: { limit: () => readLimit('THROTTLE_GLOBAL_PER_MIN', 600), ttl: THROTTLE_TTL_MS },
})
@Controller('public')
export class PublicContentsController {
  constructor(private readonly contents: PublicContentsService) {}

  @Get('contents')
  list(@Query() query: Record<string, unknown>) {
    return this.contents.list(parseQuery(query));
  }

  @Get('search')
  @Throttle({
    default: { limit: () => readLimit('THROTTLE_SEARCH_PER_MIN', 600), ttl: THROTTLE_TTL_MS },
  })
  search(@Query() query: Record<string, unknown>) {
    return this.contents.search(parseSearchQuery(query));
  }

  @Get('contents/:slug')
  detail(@Param('slug') slug: string) {
    return this.contents.getBySlug(slug);
  }

  @Get('highlights')
  highlights() {
    return this.contents.highlights();
  }

  @Get('latest')
  latest(@Query() query: Record<string, unknown>) {
    return this.contents.latest(parseLatestQuery(query).limit);
  }
}
