import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  contentInputSchema,
  contentListQuerySchema,
  paginationQuerySchema,
  type ContentInput,
  type ContentListQuery,
  type PaginationQuery,
} from '@webdakwah/shared';

import { CurrentProfile, Roles } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { ContentsService } from './contents.service.js';

function parseInput(body: unknown): ContentInput {
  const parsed = contentInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

function parseListQuery(query: unknown): ContentListQuery {
  const parsed = contentListQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter daftar konten tidak valid.');
  }

  return parsed.data;
}

function parsePaginationQuery(query: unknown): PaginationQuery {
  const parsed = paginationQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter halaman tidak valid.');
  }

  return parsed.data;
}

/** Semua rute butuh login; hak akses detail ditegakkan di ContentsService. */
@Controller('contents')
export class ContentsController {
  constructor(private readonly contents: ContentsService) {}

  @Get('mine')
  list(@CurrentProfile() profile: AuthProfile, @Query() query: Record<string, unknown>) {
    return this.contents.listMine(profile, parseListQuery(query));
  }

  @Get('review')
  @Roles('ADMIN')
  reviewQueue(@CurrentProfile() profile: AuthProfile, @Query() query: Record<string, unknown>) {
    return this.contents.listReviewQueue(profile, parsePaginationQuery(query));
  }

  @Post(':id/publish')
  @Roles('ADMIN')
  publish(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.contents.publish(profile, id);
  }

  @Post(':id/reject')
  @Roles('ADMIN')
  reject(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const note = (body as { reviewNote?: unknown } | null)?.reviewNote;

    return this.contents.reject(profile, id, typeof note === 'string' ? note : '');
  }

  @Get(':id')
  detail(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.contents.getById(profile, id);
  }

  @Post()
  create(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    return this.contents.create(profile, parseInput(body));
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.contents.update(profile, id, parseInput(body));
  }

  @Post(':id/submit')
  submit(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.contents.submit(profile, id);
  }

  @Post(':id/withdraw')
  withdraw(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.contents.withdraw(profile, id);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.contents.remove(profile, id);
  }
}
