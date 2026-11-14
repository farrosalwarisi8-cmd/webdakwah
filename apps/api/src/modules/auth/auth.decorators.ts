import { SetMetadata } from '@nestjs/common';
import type { Role } from '@webdakwah/shared';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Rute yang boleh diakses tanpa token (health check, dsb). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Batasi rute ke role tertentu; role dibaca dari profil di database. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
