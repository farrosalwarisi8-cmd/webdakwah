import type { Role } from '../constants/roles.js';

/**
 * Satu-satunya sumber aturan hak akses. API memakainya lewat RolesGuard,
 * web memakainya untuk menyembunyikan aksi yang tidak diizinkan.
 */
export const PERMISSIONS = [
  'content:create',
  'content:update-own',
  'content:publish',
  'content:delete-any',
  'users:manage',
  'taxonomy:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Kontributor hanya boleh membuat dan menyunting tulisannya sendiri (belum terbit). */
const CONTRIBUTOR_PERMISSIONS: readonly Permission[] = ['content:create', 'content:update-own'];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  CONTRIBUTOR: CONTRIBUTOR_PERMISSIONS,
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}
