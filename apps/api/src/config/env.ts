import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Daftar origin frontend yang diizinkan, dipisah koma. */
  FRONTEND_ORIGINS: z.string().default('http://localhost:3000'),
  /** Connection pooler Supabase (port 6543) untuk aplikasi. */
  DATABASE_URL: z.string().min(1).optional(),
  /** Project URL Supabase, dipakai memverifikasi token lewat JWKS. */
  SUPABASE_URL: z.url().optional(),
  /** Hanya untuk proyek Supabase lama yang masih memakai HS256. */
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
  /** Opsional: override endpoint JWKS (mis. saat memakai domain kustom). */
  SUPABASE_JWKS_URL: z.url().optional(),
  /** Webhook revalidasi cache web; keduanya harus diisi agar aktif. */
  FRONTEND_REVALIDATE_URL: z.url().optional(),
  REVALIDATE_SECRET: z.string().min(16).optional(),
  /** Cloudflare R2 untuk unggah media; semua wajib agar fitur aktif. */
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.url().optional(),
  /** Opsional: endpoint S3 kustom (mis. MinIO saat pengujian lokal). */
  R2_ENDPOINT: z.url().optional(),
  /** Batas anti-banjir (permintaan/menit). Endpoint terautentikasi dihitung per pengguna. */
  THROTTLE_GLOBAL_PER_MIN: z.coerce.number().int().positive().default(600),
  THROTTLE_UPLOAD_PER_MIN: z.coerce.number().int().positive().default(10),
  THROTTLE_SEARCH_PER_MIN: z.coerce.number().int().positive().default(600),
  THROTTLE_SESSION_PER_MIN: z.coerce.number().int().positive().default(60),
  THROTTLE_LIVE_PER_MIN: z.coerce.number().int().positive().default(120),
  /** Kuota presign per pengguna; admin bebas kuota harian dan punya batas jam sendiri. */
  UPLOAD_QUOTA_PER_HOUR: z.coerce.number().int().positive().default(20),
  UPLOAD_QUOTA_PER_DAY: z.coerce.number().int().positive().default(60),
  UPLOAD_QUOTA_ADMIN_PER_HOUR: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Konfigurasi environment tidak valid:\n${details}`);
  }

  return parsed.data;
}

/** Origin frontend dalam bentuk array, siap dipakai CORS. */
export function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
