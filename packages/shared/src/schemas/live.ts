import { z } from 'zod';

import { PLAY_MODES } from '../constants/live.js';
import { isSafeHttpUrl } from './common.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const playModeSchema = z.enum(PLAY_MODES);

/**
 * URL dengan kredensial tertanam (`user:pass@host`) tidak boleh disimpan:
 * kredensial panel radio tidak pernah masuk ke website.
 */
export function hasEmbeddedCredentials(value: string): boolean {
  try {
    const url = new URL(value);
    return url.username.length > 0 || url.password.length > 0;
  } catch {
    return true;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Alamat dengar publik. Boleh dikosongkan selama siaran belum aktif; bila
 * diisi wajib http/https dan tanpa kredensial tertanam.
 */
export const streamUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL terlalu panjang')
  .refine(
    (value) => value === '' || isSafeHttpUrl(value),
    'URL siaran harus diawali http:// atau https://',
  )
  .refine(
    (value) => value === '' || !hasEmbeddedCredentials(value),
    'URL siaran tidak boleh memuat username atau kata sandi',
  );

/** statusUrl/telegramUrl hanya boleh https agar tidak memicu mixed content. */
const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL terlalu panjang')
  .refine(
    (value) => value === '' || (isHttpsUrl(value) && !hasEmbeddedCredentials(value)),
    'URL harus https:// tanpa username/kata sandi',
  )
  .optional()
  .default('');

export const liveStreamInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Judul siaran minimal 2 karakter')
      .max(120, 'Judul siaran maksimal 120 karakter'),
    description: z
      .string()
      .trim()
      .max(500, 'Deskripsi maksimal 500 karakter')
      .optional()
      .default(''),
    streamUrl: streamUrlSchema,
    playMode: playModeSchema.optional().default('EXTERNAL'),
    statusUrl: optionalHttpsUrlSchema,
    telegramUrl: optionalHttpsUrlSchema,
    isEnabled: z.boolean().optional().default(false),
  })
  .superRefine((value, context) => {
    if (value.isEnabled && value.streamUrl === '') {
      context.addIssue({
        code: 'custom',
        path: ['streamUrl'],
        message: 'Isi alamat dengar publik sebelum mengaktifkan siaran.',
      });
    }
  })
  .transform((value) => {
    // Browser memblokir audio http di halaman https (mixed content), jadi
    // alamat http selalu dibuka di tab baru, tidak pernah disematkan.
    const playMode = isHttpsUrl(value.streamUrl) ? value.playMode : 'EXTERNAL';

    return { ...value, playMode };
  });

export type LiveStreamInput = z.infer<typeof liveStreamInputSchema>;

export const broadcastScheduleInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Judul jadwal minimal 2 karakter')
      .max(120, 'Judul jadwal maksimal 120 karakter'),
    speakerId: z.uuid('ID penceramah tidak valid').nullable().optional(),
    dayOfWeek: z
      .number()
      .int()
      .min(0, 'Hari harus antara 0 (Minggu) dan 6 (Sabtu)')
      .max(6, 'Hari harus antara 0 (Minggu) dan 6 (Sabtu)')
      .nullable()
      .optional(),
    date: z
      .string()
      .trim()
      .regex(DATE_PATTERN, 'Tanggal harus berformat YYYY-MM-DD')
      .refine(
        (value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
        'Tanggal tidak valid',
      )
      .nullable()
      .optional(),
    startTime: z.string().trim().regex(TIME_PATTERN, 'Jam mulai harus berformat HH:mm (WIB)'),
    durationMin: z
      .number()
      .int()
      .min(5, 'Durasi minimal 5 menit')
      .max(720, 'Durasi maksimal 720 menit')
      .optional()
      .default(60),
    notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional().default(''),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((value, context) => {
    const hasDay = value.dayOfWeek !== null && value.dayOfWeek !== undefined;
    const hasDate = value.date !== null && value.date !== undefined && value.date !== '';

    if (hasDay === hasDate) {
      context.addIssue({
        code: 'custom',
        path: ['dayOfWeek'],
        message: 'Pilih salah satu: hari mingguan atau tanggal khusus.',
      });
    }
  });

export type BroadcastScheduleInput = z.infer<typeof broadcastScheduleInputSchema>;

/** Pengaturan lengkap untuk dashboard admin (termasuk statusUrl). */
export const adminLiveStreamSchema = z.object({
  /** Id channel siaran; null selama pengaturan belum pernah disimpan. */
  id: z.uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  streamUrl: z.string().nullable(),
  playMode: playModeSchema,
  statusUrl: z.string().nullable(),
  telegramUrl: z.string().nullable(),
  isEnabled: z.boolean(),
  /** null selama pengaturan belum pernah disimpan. */
  updatedAt: z.string().nullable(),
});

export type AdminLiveStream = z.infer<typeof adminLiveStreamSchema>;

export const adminBroadcastScheduleSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  speakerId: z.uuid().nullable(),
  speakerName: z.string().nullable(),
  dayOfWeek: z.number().int().nullable(),
  date: z.string().nullable(),
  startTime: z.string(),
  durationMin: z.number().int(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminBroadcastSchedule = z.infer<typeof adminBroadcastScheduleSchema>;

export const adminBroadcastScheduleListSchema = z.array(adminBroadcastScheduleSchema);

/** Bentuk aman untuk publik: tanpa id, statusUrl, atau catatan internal. */
export const publicBroadcastScheduleSchema = z.object({
  title: z.string(),
  speakerName: z.string().nullable(),
  dayOfWeek: z.number().int().nullable(),
  date: z.string().nullable(),
  startTime: z.string(),
  durationMin: z.number().int(),
  notes: z.string().nullable(),
  /** Waktu mulai berikutnya dalam zona waktu jadwal (ISO), null bila acara sudah lewat. */
  nextAt: z.string().nullable(),
});

export type PublicBroadcastSchedule = z.infer<typeof publicBroadcastScheduleSchema>;

export const liveStatusSchema = z.enum(['LIVE', 'OFFLINE', 'UNKNOWN']);

export type LiveStatus = z.infer<typeof liveStatusSchema>;

export const publicLiveSchema = z.object({
  isEnabled: z.boolean(),
  title: z.string(),
  description: z.string().nullable(),
  streamUrl: z.string().nullable(),
  playMode: playModeSchema.nullable(),
  telegramUrl: z.string().nullable(),
  schedules: z.array(publicBroadcastScheduleSchema),
  liveStatus: liveStatusSchema,
  /** Id channel siaran; null selama pengaturan siaran belum pernah disimpan. */
  channelId: z.uuid().nullable(),
});

export type PublicLive = z.infer<typeof publicLiveSchema>;
