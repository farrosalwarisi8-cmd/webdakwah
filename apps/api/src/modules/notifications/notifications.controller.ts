import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { paginationQuerySchema, type PaginationQuery } from '@webdakwah/shared';

import { CurrentProfile } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { NotificationsService } from './notifications.service.js';

function parsePaginationQuery(query: unknown): PaginationQuery {
  const parsed = paginationQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new BadRequestException('Parameter halaman tidak valid.');
  }

  return parsed.data;
}

/** Semua rute hanya mengakses notifikasi milik pengguna yang login. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentProfile() profile: AuthProfile, @Query() query: Record<string, unknown>) {
    return this.notifications.list(profile, parsePaginationQuery(query));
  }

  @Get('unread-count')
  unread(@CurrentProfile() profile: AuthProfile) {
    return this.notifications.unreadCount(profile);
  }

  @Post('read-all')
  readAll(@CurrentProfile() profile: AuthProfile) {
    return this.notifications.markAllRead(profile);
  }

  @Post(':id/read')
  read(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(profile, id);
  }
}
