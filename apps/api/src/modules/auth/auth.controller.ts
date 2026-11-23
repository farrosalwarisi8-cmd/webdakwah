import { BadRequestException, Body, Controller, Get, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { profileUpdateSchema, type ProfileUpdateInput } from '@webdakwah/shared';

import { readLimit, THROTTLE_TTL_MS } from '../throttling/throttling.js';
import { CurrentProfile } from './auth.decorators.js';
import type { AuthProfile } from './auth.types.js';
import { MeService } from './me.service.js';

function parseProfileUpdate(body: unknown): ProfileUpdateInput {
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

/** Identitas pemanggil; RolesGuard sudah memastikan profil ada dan aktif. */
@Controller('me')
export class AuthController {
  constructor(private readonly me: MeService) {}

  @Get()
  @Throttle({
    default: { limit: () => readLimit('THROTTLE_SESSION_PER_MIN', 60), ttl: THROTTLE_TTL_MS },
  })
  profile(@CurrentProfile() profile: AuthProfile): AuthProfile {
    return profile;
  }

  /** Pemilik akun boleh mengubah namanya sendiri; role tidak bisa dinaikkan. */
  @Patch()
  @Throttle({
    default: { limit: () => readLimit('THROTTLE_SESSION_PER_MIN', 60), ttl: THROTTLE_TTL_MS },
  })
  update(@CurrentProfile() profile: AuthProfile, @Body() body: unknown): Promise<AuthProfile> {
    return this.me.updateProfile(profile.id, parseProfileUpdate(body));
  }
}
