#!/usr/bin/env node
/**
 * Merekam jawaban API publik terakhir ke apps/web/src/data/public-snapshot.json.
 * Cadangan ini dipakai saat `next build` bila API sedang mati, sehingga halaman
 * publik tidak dibangun dalam keadaan kosong.
 *
 * Pemakaian:
 *   pnpm snapshot:public
 *   pnpm snapshot:public -- --api=https://api.contoh.com
 *
 * Jalankan setiap kali konten penting berubah (misalnya sebelum deploy). Berkas
 * hasil ditulis apa adanya: tanpa data pribadi, hanya bentuk publik.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'apps/web/src/data/public-snapshot.json');

const SITEMAP_MAX_PAGES = 20;
const SITEMAP_PAGE_SIZE = 50;
const REQUEST_TIMEOUT_MS = 20_000;

function readApiArgument() {
  const index = process.argv.findIndex(
    (argument) => argument === '--api' || argument.startsWith('--api='),
  );

  if (index === -1) {
    return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  }

  const argument = process.argv[index];

  if (argument.includes('=')) {
    return argument.slice(argument.indexOf('=') + 1);
  }

  const next = process.argv[index + 1];

  if (!next) throw new Error('Nilai --api kosong.');

  return next;
}

/** Samakan kunci dengan `normalizeSnapshotPath` di lib/api/public-snapshot.ts. */
function normalizePath(pathname) {
  const [url, search = ''] = pathname.split('?');
  if (!search) return url;

  const params = new URLSearchParams(search);
  params.sort();
  const sorted = params.toString();

  return sorted ? `${url}?${sorted}` : url;
}

async function getJson(baseUrl, publicPath) {
  const response = await fetch(`${baseUrl}/api${publicPath}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`${publicPath} → HTTP ${response.status}`);
  }

  return response.json();
}

async function main() {
  const baseUrl = readApiArgument().replace(/\/+$/, '');
  const responses = {};

  const fixedPaths = [
    '/public/highlights',
    '/public/latest?limit=9',
    '/public/live',
    '/categories',
    '/tags',
    '/speakers',
  ];

  for (const publicPath of fixedPaths) {
    responses[normalizePath(publicPath)] = await getJson(baseUrl, publicPath);
  }

  // Sitemap memakai daftar yang sama: semua konten terbit, dibatasi 20 halaman.
  let page = 1;
  let totalPages = 1;

  while (page <= SITEMAP_MAX_PAGES && page <= totalPages) {
    const publicPath = `/public/contents?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}`;
    const result = await getJson(baseUrl, publicPath);

    responses[normalizePath(publicPath)] = result;
    totalPages = Number(result?.totalPages ?? 1);

    if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1;

    page += 1;
  }

  const entries = Object.keys(responses).sort();
  const payload = {
    generatedAt: new Date().toISOString(),
    responses: Object.fromEntries(entries.map((key) => [key, responses[key]])),
  };

  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const itemCount = Object.values(responses).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length;

    return total + (Array.isArray(value?.items) ? value.items.length : 0);
  }, 0);

  console.log(
    `Cadangan publik ditulis: ${entries.length} endpoint, ${itemCount} item ` +
      `(${payload.generatedAt}) → ${path.relative(ROOT, OUTPUT)}`,
  );
}

main().catch((error) => {
  console.error(`Gagal membuat cadangan publik: ${error instanceof Error ? error.message : error}`);
  console.error('Cadangan lama tidak diubah. Pastikan API hidup dan API_URL benar.');
  process.exitCode = 1;
});
