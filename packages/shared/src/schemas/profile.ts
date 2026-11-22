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

export const userCreateSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .max(128, 'Kata sandi terlalu panjang'),
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
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .max(128, 'Kata sandi terlalu panjang'),
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
