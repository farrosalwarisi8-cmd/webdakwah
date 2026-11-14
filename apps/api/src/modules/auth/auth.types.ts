import type { Role } from '@webdakwah/shared';

/** Isi token Supabase yang sudah diverifikasi. */
export interface AuthUser {
  id: string;
  email: string;
}

/** Profil dari tabel profiles; sumber kebenaran role, bukan klaim token. */
export interface AuthProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  isActive: boolean;
}

/**
 * Bentuk request Fastify yang dipakai guard. Sengaja tidak mengimpor tipe
 * fastify langsung agar tidak bergantung pada paket internal Nest.
 */
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthUser;
  profile?: AuthProfile;
}
