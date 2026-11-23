import type { Role } from '@webdakwah/shared';

export interface EmptyCategoryHint {
  message: string;
  action: { href: string; label: string } | null;
}

/**
 * Tanpa kategori, konten tidak bisa diajukan review. Admin diarahkan ke halaman
 * taksonomi; kontributor tidak punya izin itu, jadi cukup diberi tahu.
 */
export function emptyCategoryHint(role: Role | null | undefined): EmptyCategoryHint {
  if (role === 'ADMIN') {
    return {
      message: 'Belum ada kategori. Tambahkan minimal satu agar konten bisa diajukan review.',
      action: { href: '/dashboard/taksonomi', label: 'Buka halaman Taksonomi' },
    };
  }

  return {
    message: 'Belum ada kategori, hubungi admin.',
    action: null,
  };
}
