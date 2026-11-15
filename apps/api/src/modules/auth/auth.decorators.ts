import {
  UnauthorizedException,
  SetMetadata,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Role } from '@webdakwah/shared';

import type { AuthProfile } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Rute yang boleh diakses tanpa token (health check, dsb). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Batasi rute ke role tertentu; role dibaca dari profil di database. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

/** Profil pemanggil; RolesGuard sudah memastikan profil ada dan aktif. */
export const CurrentProfile = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthProfile => {
    const request = context.switchToHttp().getRequest<{ profile?: AuthProfile }>();

    if (!request.profile) {
      throw new UnauthorizedException('Profil pengguna tidak tersedia.');
    }

    return request.profile;
  },
);
