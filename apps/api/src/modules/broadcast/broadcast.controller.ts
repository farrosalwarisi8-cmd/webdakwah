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
} from '@nestjs/common';
import {
  broadcastScheduleInputSchema,
  liveStreamInputSchema,
  type BroadcastScheduleInput,
  type LiveStreamInput,
} from '@webdakwah/shared';

import { CurrentProfile, Roles } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { BroadcastService } from './broadcast.service.js';

function parseSettings(body: unknown): LiveStreamInput {
  const parsed = liveStreamInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

function parseSchedule(body: unknown): BroadcastScheduleInput {
  const parsed = broadcastScheduleInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

/** Semua rute di sini khusus admin; API tetap sumber otoritatif, bukan UI. */
@Controller('broadcast')
@Roles('ADMIN')
export class BroadcastController {
  constructor(private readonly broadcast: BroadcastService) {}

  @Get('settings')
  getSettings(@CurrentProfile() profile: AuthProfile) {
    this.broadcast.assertManager(profile);
    return this.broadcast.getSettings();
  }

  @Patch('settings')
  updateSettings(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    this.broadcast.assertManager(profile);
    return this.broadcast.updateSettings(parseSettings(body));
  }

  @Get('schedules')
  listSchedules(@CurrentProfile() profile: AuthProfile) {
    this.broadcast.assertManager(profile);
    return this.broadcast.listSchedules();
  }

  @Post('schedules')
  createSchedule(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    this.broadcast.assertManager(profile);
    return this.broadcast.createSchedule(parseSchedule(body));
  }

  @Patch('schedules/:id')
  updateSchedule(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.broadcast.assertManager(profile);
    return this.broadcast.updateSchedule(id, parseSchedule(body));
  }

  @Delete('schedules/:id')
  deleteSchedule(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.broadcast.assertManager(profile);
    return this.broadcast.deleteSchedule(id);
  }
}
