import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI memakai koneksi langsung (DIRECT_URL) untuk migrasi, sedangkan
 * aplikasi memakai DATABASE_URL lewat connection pooler Supabase.
 * Nilai kosong dibiarkan agar `prisma generate` tetap jalan tanpa kredensial.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
