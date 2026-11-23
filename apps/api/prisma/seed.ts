import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedCategories } from './taxonomy-seed.js';

/**
 * Menyiapkan data awal: kategori bawaan (selalu) dan satu akun admin pertama (opsional).
 *
 * Bagian taksonomi tidak butuh kredensial Supabase, jadi instalasi baru tetap punya
 * kategori minimal dan kontributor bisa mengajukan review. Bagian akun admin hanya
 * berjalan bila SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD diisi, dan butuh kredensial
 * server Supabase; tidak pernah dijalankan otomatis saat deploy.
 *
 * Pemakaian: pnpm --filter api db:seed
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variabel ${name} wajib diisi untuk menjalankan bagian seed ini.`);
  }
  return value;
}

async function seedAdmin(prisma: PrismaClient, email: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD minimal 8 karakter.');
  }

  const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
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

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId, email, role: 'ADMIN', isActive: true, accountStatus: 'APPROVED' },
    update: { email, role: 'ADMIN', isActive: true, accountStatus: 'APPROVED' },
  });

  process.stdout.write(`Admin siap: ${profile.email} (role ${profile.role}).\n`);
}

async function main(): Promise<void> {
  const connectionString = process.env.DIRECT_URL ?? required('DATABASE_URL');
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const taxonomy = await seedCategories(prisma);
    process.stdout.write(
      `Taksonomi siap: ${taxonomy.created} kategori dibuat, ${taxonomy.existing} sudah ada.\n`,
    );

    if (!email || !password) {
      process.stdout.write(
        'SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD kosong: pembuatan akun admin dilewati.\n',
      );
      return;
    }

    // Akun admin opsional: jangan gagalkan pembuatan kategori hanya karena kredensial
    // server Supabase belum diisi.
    if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      process.stdout.write(
        'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY kosong: pembuatan akun admin dilewati.\n',
      );
      return;
    }

    await seedAdmin(prisma, email, password);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
