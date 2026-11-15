import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { readLimit, THROTTLE_TTL_MS } from '../throttling/throttling.js';
import { CurrentProfile } from './auth.decorators.js';
import type { AuthProfile } from './auth.types.js';

/** Identitas pemanggil; RolesGuard sudah memastikan profil ada dan aktif. */
@Controller('me')
export class AuthController {
  @Get()
  @Throttle({
    default: { limit: () => readLimit('THROTTLE_SESSION_PER_MIN', 60), ttl: THROTTLE_TTL_MS },
  })
  me(@CurrentProfile() profile: AuthProfile): AuthProfile {
    return profile;
  }
}
