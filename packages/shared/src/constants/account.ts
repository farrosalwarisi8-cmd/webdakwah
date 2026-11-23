/** Status persetujuan akun kontributor hasil pendaftaran mandiri. */
export const ACCOUNT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: 'Menunggu persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

/**
 * Akun yang boleh menulis konten. PENDING dan REJECTED tetap bisa login dan
 * membaca dashboard, tetapi API menolak pembuatan/pengajuan konten.
 */
export function canWriteContent(status: AccountStatus): boolean {
  return status === 'APPROVED';
}
