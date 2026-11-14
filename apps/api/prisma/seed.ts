import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Membuat (atau menaikkan) satu akun admin pertama.
 * Butuh kredensial server Supabase; tidak pernah dijalankan otomatis saat deploy.
 *
 * Pemakaian: pnpm --filter api db:seed
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variabel ${name} wajib diisi untuk menjalankan seed.`);
  }
  return value;
}

async function main(): Promise<void> {
  const supabaseUrl = required('SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const email = required('SEED_ADMIN_EMAIL').toLowerCase();
  const password = required('SEED_ADMIN_PASSWORD');
  const connectionString = process.env.DIRECT_URL ?? required('DATABASE_URL');

  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD minimal 8 karakter.');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw new Error(`Gagal membaca daftar pengguna Supabase: ${listError.message}`);
  }

  let userId = existing.users.find((user) => user.email?.toLowerCase() === email)?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error ?? !data.user) {
      throw new Error(`Gagal membuat pengguna Supabase: ${error?.message ?? 'tidak ada data'}`);
    }

    userId = data.user.id;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const profile = await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, email, role: 'ADMIN', isActive: true },
      update: { email, role: 'ADMIN', isActive: true },
    });

    process.stdout.write(`Admin siap: ${profile.email} (role ${profile.role}).\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
