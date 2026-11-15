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
