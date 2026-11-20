import { z } from 'zod';

/** Baca publik: jumlah pengguna yang mengikuti channel siaran. */
export const publicWatchCountSchema = z.object({
  watcherCount: z.number().int().min(0),
});

export type PublicWatchCount = z.infer<typeof publicWatchCountSchema>;

/** Status ikut-siaran untuk pengguna yang sedang login. */
export const watchStatusSchema = z.object({
  watching: z.boolean(),
  watcherCount: z.number().int().min(0),
});

export type WatchStatus = z.infer<typeof watchStatusSchema>;

/** Satu baris daftar pengikut untuk dashboard admin. */
export const broadcastWatchingListItemSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  fullName: z.string().nullable(),
  email: z.string(),
  /** Waktu mulai mengikuti siaran, ISO. */
  createdAt: z.string(),
});

export type BroadcastWatchingListItem = z.infer<typeof broadcastWatchingListItemSchema>;

/** Halaman daftar pengikut untuk dashboard admin. */
export const broadcastWatchingListSchema = z.object({
  items: z.array(broadcastWatchingListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
});

export type BroadcastWatchingList = z.infer<typeof broadcastWatchingListSchema>;
