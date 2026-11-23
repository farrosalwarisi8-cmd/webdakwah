/**
 * Data taksonomi awal untuk instalasi baru.
 *
 * "Ajukan review" mewajibkan minimal satu kategori, jadi tanpa kategori tidak ada
 * kontributor yang bisa mengajukan konten. Daftar ini sengaja berisi nama umum saja;
 * tidak ada penceramah atau tag fiktif.
 *
 * Fungsi ini idempoten: menjalankannya berulang tidak membuat duplikat dan tidak
 * menimpa kategori yang sudah ada (termasuk yang sudah diubah admin).
 */

export const SEED_CATEGORIES = [
  'Aqidah',
  'Fiqih',
  'Akhlak',
  'Sirah Nabawiyah',
  'Tazkiyatun Nafs',
  'Tafsir',
  'Hadis',
  'Doa dan Dzikir',
  'Keluarga',
  'Muamalah',
] as const;

/** Klien minimal yang dibutuhkan seed; PrismaClient memenuhinya secara struktural. */
export interface TaxonomySeedClient {
  category: {
    findFirst(args: {
      where: { OR: { name: string } | { slug: string }[] };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: { data: { name: string; slug: string } }): Promise<{ id: string }>;
  };
}

export function slugifyCategoryName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export interface TaxonomySeedResult {
  created: number;
  existing: number;
}

export async function seedCategories(client: TaxonomySeedClient): Promise<TaxonomySeedResult> {
  let created = 0;
  let existing = 0;

  for (const name of SEED_CATEGORIES) {
    const slug = slugifyCategoryName(name);

    // Cocokkan nama dulu (kategori bawaan mungkin sudah diubah slug-nya), lalu slug
    // agar tidak bentrok bila admin sudah memakai slug yang sama untuk nama lain.
    const found = await client.category.findFirst({
      where: { OR: [{ name }, { slug }] },
      select: { id: true },
    });

    if (found) {
      existing += 1;
      continue;
    }

    await client.category.create({ data: { name, slug } });
    created += 1;
  }

  return { created, existing };
}
