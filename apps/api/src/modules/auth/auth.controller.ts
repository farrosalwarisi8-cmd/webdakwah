import {
  Controller,
  Get,
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

import type { AuthProfile } from './auth.types.js';

export const CurrentProfile = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthProfile => {
    const request = context.switchToHttp().getRequest<{ profile?: AuthProfile }>();

    if (!request.profile) {
      throw new UnauthorizedException('Profil pengguna tidak tersedia.');
    }

    return request.profile;
  },
);

/** Identitas pemanggil; RolesGuard sudah memastikan profil ada dan aktif. */
@Controller('me')
export class AuthController {
  @Get()
  me(@CurrentProfile() profile: AuthProfile): AuthProfile {
    return profile;
  }
}
