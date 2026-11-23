import { z } from 'zod';

import { ROLES } from '../constants/roles.js';

export const userSummarySchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  /** ISO timestamp konfirmasi email; null bila email belum diverifikasi. */
  emailVerifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Satu-satunya aturan sandi: dipakai pendaftaran, ubah sandi, dan reset oleh admin. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .max(PASSWORD_MAX_LENGTH, 'Kata sandi terlalu panjang');

/** Perubahan profil oleh pemiliknya sendiri; role/status sengaja tidak bisa diubah. */
export const profileUpdateSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Nama tidak boleh kosong')
      .max(120, 'Nama lengkap maksimal 120 karakter'),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const userCreateSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  fullName: z.string().trim().max(120, 'Nama lengkap maksimal 120 karakter').optional().default(''),
  role: z.enum(ROLES).default('CONTRIBUTOR'),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z
  .object({
    fullName: z.string().trim().max(120, 'Nama lengkap maksimal 120 karakter').optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined || value.role !== undefined || value.isActive !== undefined,
    'Minimal satu field harus diubah.',
  );

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const userPasswordResetSchema = z.object({
  password: passwordSchema,
});

export type UserPasswordResetInput = z.infer<typeof userPasswordResetSchema>;

/** Profil publik pengguna yang dikembalikan GET /api/me. */
export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  emailVerifiedAt: z.string().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
