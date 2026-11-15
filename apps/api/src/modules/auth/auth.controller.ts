import { Controller, Get } from '@nestjs/common';

import { CurrentProfile } from './auth.decorators.js';
import type { AuthProfile } from './auth.types.js';

/** Identitas pemanggil; RolesGuard sudah memastikan profil ada dan aktif. */
@Controller('me')
export class AuthController {
  @Get()
  me(@CurrentProfile() profile: AuthProfile): AuthProfile {
    return profile;
  }
}
