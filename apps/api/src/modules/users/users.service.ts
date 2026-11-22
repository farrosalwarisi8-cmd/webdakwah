import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { UserCreateInput, UserSummary, UserUpdateInput } from '@webdakwah/shared';
import { can } from '@webdakwah/shared';
import type { AuthProfile } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

function toSummary(profile: {
  id: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'CONTRIBUTOR';
  isActive: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UserSummary {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    isActive: profile.isActive,
    emailVerifiedAt: profile.emailVerifiedAt ? profile.emailVerifiedAt.toISOString() : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.supabase =
      url && key
        ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
        : null;
  }

  assertManager(profile: AuthProfile): void {
    if (!can(profile.role, 'users:manage')) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk mengelola pengguna.');
    }
  }

  async listUsers(): Promise<UserSummary[]> {
    const profiles = await this.prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return profiles.map((profile) => toSummary(profile));
  }

  // Alias untuk kompatibilitas pemanggilan yang berbeda.
  async list(): Promise<UserSummary[]> {
    return this.listUsers();
  }

  async findAll(): Promise<UserSummary[]> {
    return this.listUsers();
  }

  async getUser(id: string): Promise<UserSummary> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    return toSummary(profile);
  }

  async findById(id: string): Promise<UserSummary> {
    return this.getUser(id);
  }

  async createUser(input: UserCreateInput, actorId?: string): Promise<UserSummary> {
    void actorId;

    if (!this.supabase) {
      throw new ServiceUnavailableException(
        'Pengelolaan pengguna belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY).',
      );
    }

    const email = input.email.trim().toLowerCase();

    const existing = await this.prisma.profile.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar.');
    }

    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName ?? '' },
    });

    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Gagal membuat pengguna Supabase.');
    }

    try {
      const profile = await this.prisma.profile.upsert({
        where: { id: data.user.id },
        create: {
          id: data.user.id,
          email,
          fullName: input.fullName?.trim() || null,
          role: input.role,
          isActive: true,
        },
        update: {
          email,
          fullName: input.fullName?.trim() || null,
          role: input.role,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return toSummary(profile);
    } catch (error) {
      await this.supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw error;
    }
  }

  async create(input: UserCreateInput, actorId?: string): Promise<UserSummary> {
    return this.createUser(input, actorId);
  }

  async updateUser(id: string, input: UserUpdateInput, actorId?: string): Promise<UserSummary> {
    const existing = await this.prisma.profile.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (actorId && actorId === id && input.isActive === false) {
      throw new BadRequestException('Anda tidak bisa menonaktifkan akun sendiri.');
    }

    if (actorId && actorId === id && input.role && input.role !== existing.role) {
      throw new BadRequestException('Anda tidak bisa mengubah role akun sendiri.');
    }

    const profile = await this.prisma.profile.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() || null } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return toSummary(profile);
  }

  async update(id: string, input: UserUpdateInput, actorId?: string): Promise<UserSummary> {
    return this.updateUser(id, input, actorId);
  }

  async resetPassword(id: string, password: string): Promise<{ ok: true }> {
    if (!this.supabase) {
      throw new ServiceUnavailableException(
        'Pengelolaan pengguna belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY).',
      );
    }

    const profile = await this.prisma.profile.findUnique({ where: { id }, select: { id: true } });
    if (!profile) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const { error } = await this.supabase.auth.admin.updateUserById(id, { password });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }

  async updatePassword(id: string, password: string): Promise<{ ok: true }> {
    return this.resetPassword(id, password);
  }

  async removeUser(id: string, actorId?: string): Promise<{ ok: true; id: string }> {
    if (actorId && actorId === id) {
      throw new BadRequestException('Anda tidak bisa menghapus akun sendiri.');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id }, select: { id: true } });
    if (!profile) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    await this.prisma.profile.delete({ where: { id } });

    if (this.supabase) {
      await this.supabase.auth.admin.deleteUser(id).catch(() => undefined);
    }

    return { ok: true, id };
  }

  async remove(id: string, actorId?: string): Promise<{ ok: true; id: string }> {
    return this.removeUser(id, actorId);
  }

  async delete(id: string, actorId?: string): Promise<{ ok: true; id: string }> {
    return this.removeUser(id, actorId);
  }

  async deleteUser(id: string, actorId?: string): Promise<{ ok: true; id: string }> {
    return this.removeUser(id, actorId);
  }
}
