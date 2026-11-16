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
  userCreateSchema,
  userPasswordResetSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserPasswordResetInput,
  type UserUpdateInput,
} from '@webdakwah/shared';

import { CurrentProfile, Roles } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { UsersService } from './users.service.js';

function parseCreate(body: unknown): UserCreateInput {
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }
  return parsed.data;
}

function parseUpdate(body: unknown): UserUpdateInput {
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }
  return parsed.data;
}

function parsePasswordReset(body: unknown): UserPasswordResetInput {
  const parsed = userPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }
  return parsed.data;
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('ADMIN')
  list(@CurrentProfile() profile: AuthProfile) {
    this.users.assertManager(profile);
    return this.users.listUsers();
  }

  @Get(':id')
  @Roles('ADMIN')
  detail(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.users.assertManager(profile);
    return this.users.getUser(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    this.users.assertManager(profile);
    return this.users.createUser(parseCreate(body), profile.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.users.assertManager(profile);
    return this.users.updateUser(id, parseUpdate(body), profile.id);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  resetPassword(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.users.assertManager(profile);
    return this.users.resetPassword(id, parsePasswordReset(body).password);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.users.assertManager(profile);
    return this.users.removeUser(id, profile.id);
  }
}
