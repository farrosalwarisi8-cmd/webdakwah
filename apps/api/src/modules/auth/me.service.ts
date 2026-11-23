import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProfileUpdateInput } from '@webdakwah/shared';

import type { AuthProfile } from './auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Perubahan profil oleh pemilik akun. Hanya nama yang bisa diubah di sini;
 * role dan status keaktifan tetap wewenang admin lewat /api/users.
 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(id: string, input: ProfileUpdateInput): Promise<AuthProfile> {
    try {
      return await this.prisma.profile.update({
        where: { id },
        data: { fullName: input.fullName },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
        },
      });
    } catch {
      throw new NotFoundException('Profil tidak ditemukan.');
    }
  }
}
