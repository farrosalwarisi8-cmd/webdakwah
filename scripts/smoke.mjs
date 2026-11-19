// Uji asap (smoke) penerbitan.
//
// Uji cepat bahwa API dan web dapat dilayani, konten publik terbit,
// taksonomi publik ada, siaran publik hidup, sitemap dan robots tersedia,
// serta endpoint admin menolak tanpa token. Tidak mengubah data dan
// tidak menyimpan kredensial.
//
// Penggunaan:
//   pnpm smoke --api=http://localhost:3001 --web=http://localhost:3000
// Atau:
//   API_URL=http://localhost:3001 WEB_URL=http://localhost:3000 pnpm smoke
//
// Keluar 0 bila semua cek lolos; 1 bila ada yang gagal. Pesan kesalahan
// menyatakan jelas alasannya serta base URL yang digunakan.

import { setTimeout as sleep } from 'node:timers/promises';

const BASE = new URL(
  process.env.API_URL ?? 'http://localhost:3001',
  process.argv.includes('--api')
    ? new URL(process.argv[process.argv.indexOf('--api') + 1])
    : undefined,
);

const WEB = new URL(
  process.env.WEB_URL ?? 'http://localhost:3000',
  process.argv.includes('--web')
    ? new URL(process.argv[process.argv.indexOf('--web') + 1])
    : undefined,
);

const failures = [];

function check(name, condition, detail) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures.push(name);
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function fetchJson(url, options = {}, maxRetries = 5) {
  let lastError;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* tidak JSON */
      }
      return { status: res.status, body: text, data, headers: res.headers };
    } catch (error) {
      lastError = error;
      await sleep(800);
    }
  }
  throw lastError;
}

async function fetchText(url, options = {}) {
  return (await fetchJson(url, options)).body;
}

async function main() {
  console.log(`Smoke: API ${BASE.host}, Web ${WEB.host}`);
  console.log('');

  // 1. /health (API)
  let health = null;
  try {
    health = await fetchJson(`${BASE}/health`);
  } catch (error) {
    failures.push('/health');
    console.error(`✗ /health — ${error.message}`);
  }
  check('/health', Boolean(health), 'API tidak menjawab');

  // 2. Daftar konten publik
  let publicContents = null;
  try {
    publicContents = await fetchJson(`${BASE}/api/public/contents?page=1&pageSize=5`);
  } catch (error) {
    failures.push('/api/public/contents');
    console.error(`✗ /api/public/contents — ${error.message}`);
  }
  check(
    'daftar konten publik',
    Boolean(publicContents && Array.isArray(publicContents.items)),
    'tidak mengembalikan daftar konten terbit',
  );

  // 3. Kategori, tag, penceramah publik
  const taxonomy = [];
  for (const route of ['/api/categories', '/api/tags', '/api/speakers']) {
    try {
      const res = await fetchJson(`${BASE}${route}`);
      taxonomy.push(route, Boolean(Array.isArray(res?.items ?? res?.categories ?? res?.speakers)));
    } catch {
      taxonomy.push(route, false);
    }
  }
  check('kategori/tag/penceramah publik', taxonomy.every(Boolean));

  // 4. /api/public/live (siaran publik)
  let live = null;
  try {
    live = await fetchJson(`${BASE}/api/public/live`);
  } catch (error) {
    failures.push('/api/public/live');
    console.error(`✗ /api/public/live — ${error.message}`);
  }
  check('pengaturan siaran publik', Boolean(live));

  // 5. sitemap.xml
  let sitemap = null;
  try {
    sitemap = await fetchText(`${WEB}/sitemap.xml`);
  } catch (error) {
    failures.push('/sitemap.xml');
    console.error(`✗ /sitemap.xml — ${error.message}`);
  }
  check('sitemap.xml', Boolean(sitemap && sitemap.includes('<urlset')));

  // 6. robots.txt
  let robots = null;
  try {
    robots = await fetchText(`${WEB}/robots.txt`);
  } catch (error) {
    failures.push('/robots.txt');
    console.error(`✗ /robots.txt — ${error.message}`);
  }
  check('robots.txt', Boolean(robots && robots.includes('User-agent')));

  // 7. Endpoint admin menolak tanpa token (401/403)
  let adminRejected = false;
  try {
    const res = await fetch(`${BASE}/api/contents/review?page=1&pageSize=10`, {
      headers: { authorization: 'Bearer invalid-token' },
    });
    adminRejected = [401, 403].includes(res.status);
  } catch {
    adminRejected = false;
  }
  check('endpoint admin menolak tanpa token', adminRejected, 'mengembalikan 401/403');

  // 8. Web halaman utama
  let home = null;
  try {
    home = await fetchText(`${WEB}/`);
  } catch (error) {
    failures.push('/');
    console.error(`✗ / — ${error.message}`);
  }
  check('halaman beranda web', Boolean(home && home.includes('<html')));

  // 9. Pelabuhan API web (jika tersedia)
  let apiRoute = null;
  try {
    apiRoute = await fetchText(`${API_URL}/api/contents/review?page=1&pageSize=1`);
  } catch {
    apiRoute = null;
  }
  check('pusat API web', Boolean(apiRoute));

  console.log('');

  if (failures.length > 0) {
    console.error(`Gagal: ${failures.length} cek belum lolos`);
    failures.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }

  console.log('Semua cek lolos.');
}

main().catch((error) => {
  console.error('Fall back:', error);
  process.exit(1);
});
