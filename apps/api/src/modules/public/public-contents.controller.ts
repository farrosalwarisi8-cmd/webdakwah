import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import {
  publicContentQuerySchema,
  publicSearchQuerySchema,
  type PublicContentQuery,
  type PublicSearchQuery,
} from '@webdakwah/shared';

import { Public } from '../auth/auth.decorators.js';
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

/** Rute baca publik: hanya konten berstatus PUBLISHED yang pernah keluar. */
@Public()
@Controller('public')
export class PublicContentsController {
  constructor(private readonly contents: PublicContentsService) {}

  @Get('contents')
  list(@Query() query: Record<string, unknown>) {
    return this.contents.list(parseQuery(query));
  }

  @Get('search')
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
}
