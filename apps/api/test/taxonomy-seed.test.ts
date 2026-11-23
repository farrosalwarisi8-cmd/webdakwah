import { describe, expect, it, vi } from 'vitest';

import {
  SEED_CATEGORIES,
  seedCategories,
  slugifyCategoryName,
  type TaxonomySeedClient,
} from '../prisma/taxonomy-seed.js';

function createClient(existingNames: string[] = []) {
  const rows = new Map<string, { id: string; name: string; slug: string }>();

  for (const name of existingNames) {
    rows.set(name, { id: `id-${name}`, name, slug: slugifyCategoryName(name) });
  }

  const client: TaxonomySeedClient = {
    category: {
      findFirst: vi.fn(async ({ where }) => {
        for (const clause of where.OR) {
          if ('name' in clause) {
            const row = rows.get(clause.name);
            if (row) return { id: row.id };
          }

          if ('slug' in clause) {
            const row = [...rows.values()].find((item) => item.slug === clause.slug);
            if (row) return { id: row.id };
          }
        }

        return null;
      }),
      create: vi.fn(async ({ data }) => {
        const row = { id: `id-${data.name}`, ...data };
        rows.set(data.name, row);

        return { id: row.id };
      }),
    },
  };

  return { client, rows };
}

describe('seedCategories', () => {
  it('membuat semua kategori bawaan pada instalasi kosong', async () => {
    const { client, rows } = createClient();

    const result = await seedCategories(client);

    expect(result).toEqual({ created: SEED_CATEGORIES.length, existing: 0 });
    expect(rows.size).toBe(SEED_CATEGORIES.length);
    expect([...rows.values()].map((row) => row.slug)).toContain('doa-dan-dzikir');
  });

  it('idempoten saat dijalankan berulang', async () => {
    const { client, rows } = createClient();

    await seedCategories(client);
    const callsAfterFirst = vi.mocked(client.category.create).mock.calls.length;

    const second = await seedCategories(client);

    expect(second).toEqual({ created: 0, existing: SEED_CATEGORIES.length });
    expect(vi.mocked(client.category.create).mock.calls.length).toBe(callsAfterFirst);
    expect(rows.size).toBe(SEED_CATEGORIES.length);
  });

  it('tidak membuat duplikat bila slug sudah dipakai nama lain', async () => {
    const { client, rows } = createClient();
    await client.category.create({ data: { name: 'Fiqih Ibadah', slug: 'fiqih' } });

    const result = await seedCategories(client);

    expect(result.created).toBe(SEED_CATEGORIES.length - 1);
    expect(result.existing).toBe(1);
    expect([...rows.values()].filter((row) => row.slug === 'fiqih')).toHaveLength(1);
  });
});

describe('slugifyCategoryName', () => {
  it('menormalkan spasi, kapital, dan tanda baca', () => {
    expect(slugifyCategoryName('  Doa & Dzikir  ')).toBe('doa-dzikir');
  });
});
