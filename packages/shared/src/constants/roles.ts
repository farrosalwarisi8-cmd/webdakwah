/**
 * Role disimpan di tabel Profile (bukan metadata user), sehingga user tidak bisa
 * menaikkan hak aksesnya sendiri lewat Supabase Auth.
 */
export const ROLES = ['ADMIN', 'CONTRIBUTOR'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  CONTRIBUTOR: 'Kontributor',
};
