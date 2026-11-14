import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyRole, type Role } from '@webdakwah/shared';

import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Menentukan hak akses dari tabel profiles, bukan dari klaim token.
 * User yang dinonaktifkan langsung ditolak meski tokennya masih valid.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Sesi tidak ditemukan. Silakan masuk.');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    if (!profile) {
      throw new ForbiddenException('Profil pengguna belum dibuat. Hubungi admin.');
    }

    if (!profile.isActive) {
      throw new ForbiddenException('Akun Anda sedang dinonaktifkan. Hubungi admin.');
    }

    request.profile = profile;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(profile.role, requiredRoles)) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk tindakan ini.');
    }

    return true;
  }
}
