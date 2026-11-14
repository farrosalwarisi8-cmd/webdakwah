import { z } from 'zod';

import { ROLES } from '../constants/roles.js';

/** Profil publik pengguna yang dikembalikan GET /api/me. */
export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
