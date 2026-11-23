// Uji asap (smoke) penerbitan.
//
// Uji cepat bahwa API dan web dapat dilayani, konten publik terbit,
// taksonomi publik ada, siaran publik hidup, sitemap dan robots tersedia,
// PWA (manifest, service worker, halaman offline/simpanan/siaran) sehat,
// serta endpoint admin menolak tanpa token. Tidak mengubah data dan
// tidak menyimpan kredensial.
//
// Penggunaan:
//   pnpm smoke --api=https://api-staging.contoh.com --web=https://web-staging.contoh.com
// Atau:
//   API_URL=https://... WEB_URL=https://... pnpm smoke
//
// Keluar 0 bila semua cek lolos; 1 bila ada yang gagal. Pesan kesalahan
// menyatakan jelas alasannya serta URL yang diperiksa.

import { setTimeout as sleep } from 'node:timers/promises';

// Menerima `--api=URL` maupun `--api URL`. pnpm 12 meneruskan argumen setelah
// `--` sebagai satu token, jadi bentuk `--api=URL` yang paling andal dipakai.
function readArg(flag) {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));

  if (inline) return inline.slice(flag.length + 1) || null;

  const index = process.argv.indexOf(flag);

  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function parseBase(value, label) {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    console.error(`Argumen ${label} bukan URL yang valid: ${value}`);
    process.exit(1);
  }
}

const BASE =
  parseBase(readArg('--api') ?? process.env.API_URL, '--api/API_URL') ??
  new URL('http://localhost:3001');
const WEB =
  parseBase(readArg('--web') ?? process.env.WEB_URL, '--web/WEB_URL') ??
  new URL('http://localhost:3000');

const failures = [];

function pass(name) {
  console.log(`✓ ${name}`);
}

function fail(name, detail) {
  failures.push(name);
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function check(name, condition, detail) {
  if (condition) {
    pass(name);
  } else {
    fail(name, detail);
  }
}

function urlOf(base, path) {
  return new URL(path, base).href;
}

async function request(url, options = {}, maxRetries = 5) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data = null;

      try {
        data = JSON.parse(text);
      } catch {
        /* bukan JSON */
      }

      return { status: res.status, body: text, data, headers: res.headers, url, error: null };
    } catch (error) {
      lastError = error;
      await sleep(800);
    }
  }

  return { status: 0, body: '', data: null, headers: new Headers(), url, error: lastError };
}

async function fetchText(url, options = {}) {
  return (await request(url, options)).body;
}

/** Cek halaman HTML: status, tipe isi, dan penanda teks yang stabil. */
async function checkPage(name, path, marker) {
  const target = urlOf(WEB, path);
  const res = await request(target);

  if (res.error) {
    fail(name, `tidak bisa dihubungi (${target}): ${res.error.message}`);
    return null;
  }

  if (res.status !== 200) {
    fail(name, `${target} mengembalikan status ${res.status}`);
    return null;
  }

  if (!res.body.includes('<html')) {
    fail(name, `${target} tidak mengembalikan dokumen HTML`);
    return null;
  }

  if (marker && !res.body.includes(marker)) {
    fail(name, `${target} tidak memuat teks "${marker}" (halaman berubah?)`);
    return null;
  }

  pass(name);
  return res;
}

/** Mengambil ikon manifest dan memastikan benar-benar gambar PNG. */
async function checkIcon(src, label) {
  const target = new URL(src, WEB).href;
  const res = await request(target, {}, 3);

  if (res.error) {
    fail(label, `${target} tidak bisa diambil: ${res.error.message}`);
    return;
  }

  if (res.status !== 200) {
    fail(label, `${target} mengembalikan status ${res.status}`);
    return;
  }

  const type = res.headers.get('content-type') ?? '';
  check(
    label,
    type.toLowerCase().includes('image/png'),
    `${target} bertipe "${type || '(kosong)'}"`,
  );
}

async function checkManifest() {
  const target = urlOf(WEB, '/manifest.webmanifest');
  const res = await request(target);

  if (res.error) {
    fail('manifest PWA', `tidak bisa dihubungi (${target}): ${res.error.message}`);
    return;
  }

  if (res.status !== 200) {
    fail('manifest PWA', `${target} mengembalikan status ${res.status}`);
    return;
  }

  const contentType = res.headers.get('content-type') ?? '';
  check(
    'manifest PWA bertipe JSON',
    contentType.toLowerCase().includes('json'),
    `${target} bertipe "${contentType || '(kosong)'}"`,
  );

  if (!res.data || typeof res.data !== 'object') {
    fail('manifest PWA JSON valid', `${target} bukan JSON yang bisa diurai`);
    return;
  }

  const manifest = res.data;
  check('manifest PWA JSON valid', true);

  const missing = ['name', 'short_name', 'start_url', 'display'].filter(
    (key) => typeof manifest[key] !== 'string' || manifest[key].length === 0,
  );
  check(
    'manifest PWA punya name/start_url/display',
    missing.length === 0,
    `kolom hilang atau kosong: ${missing.join(', ') || '(tidak ada)'}`,
  );

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const findIcon = (sizes, purpose) =>
    icons.find(
      (icon) =>
        typeof icon?.src === 'string' &&
        icon.sizes === sizes &&
        (purpose === undefined || String(icon.purpose ?? 'any').includes(purpose)),
    );

  const icon192 = findIcon('192x192');
  const icon512 = findIcon('512x512');
  const maskable = findIcon('512x512', 'maskable');

  check('manifest PWA memuat ikon 192', Boolean(icon192), 'tidak ada ikon sizes "192x192"');
  check('manifest PWA memuat ikon 512', Boolean(icon512), 'tidak ada ikon sizes "512x512"');
  check(
    'manifest PWA memuat ikon maskable',
    Boolean(maskable),
    'tidak ada ikon 512 bertanda maskable',
  );

  // Ikon yang tercantum harus benar-benar bisa diambil; manifest valid tetapi
  // ikon 404 tetap membuat PWA tidak bisa dipasang.
  if (icon192) await checkIcon(icon192.src, 'ikon 192 dapat diambil');
  if (icon512) await checkIcon(icon512.src, 'ikon 512 dapat diambil');
  if (maskable) await checkIcon(maskable.src, 'ikon maskable dapat diambil');
}

async function checkServiceWorker() {
  const target = urlOf(WEB, '/sw.js');
  const res = await request(target);

  if (res.error) {
    fail('service worker /sw.js', `tidak bisa dihubungi (${target}): ${res.error.message}`);
    return;
  }

  if (res.status !== 200) {
    fail('service worker /sw.js', `${target} mengembalikan status ${res.status}`);
    return;
  }

  const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
  check(
    'service worker bertipe JavaScript',
    contentType.includes('javascript'),
    `${target} bertipe "${contentType || '(kosong)'}"`,
  );

  const cacheControl = (res.headers.get('cache-control') ?? '').toLowerCase();
  check(
    'service worker tidak di-cache permanen',
    cacheControl.includes('no-cache') ||
      cacheControl.includes('must-revalidate') ||
      cacheControl.includes('max-age=0'),
    `${target} memakai Cache-Control "${cacheControl || '(kosong)'}" — pembaruan SW bisa tertunda`,
  );

  const allowed = res.headers.get('service-worker-allowed');
  check(
    'service worker punya Service-Worker-Allowed: /',
    allowed === '/',
    `${target} mengirim "${allowed ?? '(kosong)'}" — scope root tidak diizinkan`,
  );

  check(
    'service worker memuat logika cache',
    res.body.includes('webdakwah-') && res.body.includes('install'),
    `${target} tidak tampak seperti service worker aplikasi (isi tak terduga)`,
  );
}

async function checkLive() {
  const target = urlOf(BASE, '/api/public/live');
  const res = await request(target);

  if (res.error) {
    fail('/api/public/live', `tidak bisa dihubungi (${target}): ${res.error.message}`);
    return null;
  }

  if (res.status !== 200 || !res.data || typeof res.data !== 'object') {
    fail('/api/public/live', `${target} mengembalikan status ${res.status} dengan isi tak terduga`);
    return null;
  }

  pass('pengaturan siaran publik');

  const statuses = ['LIVE', 'OFFLINE', 'UNKNOWN'];
  check(
    'status siaran publik dikenali',
    statuses.includes(res.data.liveStatus),
    `liveStatus "${String(res.data.liveStatus)}" tidak termasuk ${statuses.join('/')}`,
  );

  // Data internal tidak boleh bocor ke respons publik.
  check(
    'respons siaran publik tanpa statusUrl',
    !Object.prototype.hasOwnProperty.call(res.data, 'statusUrl'),
    'statusUrl ikut terkirim ke publik',
  );

  return res.data;
}

async function main() {
  console.log(`Smoke: API ${BASE.origin}, Web ${WEB.origin}`);
  console.log('');

  // 1. /health (API)
  const health = await request(urlOf(BASE, '/health')).catch((error) => ({ error }));
  check(
    '/health',
    Boolean(health && !health.error && health.status === 200 && health.data?.status),
    health?.error
      ? `API tidak menjawab: ${health.error.message}`
      : `status ${health?.status ?? '?'}`,
  );

  // 2. Daftar konten publik
  const contents = await request(urlOf(BASE, '/api/public/contents?page=1&pageSize=5'));
  check(
    'daftar konten publik',
    contents.status === 200 && Array.isArray(contents.data?.items),
    contents.error
      ? `tidak bisa dihubungi: ${contents.error.message}`
      : `status ${contents.status}, items ${Array.isArray(contents.data?.items) ? 'ada' : 'hilang'}`,
  );

  // 3. Kategori, tag, penceramah publik
  for (const route of ['/api/categories', '/api/tags', '/api/speakers']) {
    const res = await request(urlOf(BASE, route));
    // Endpoint taksonomi mengembalikan array langsung; `items`/`categories`/`speakers`
    // diterima juga agar smoke tidak pecah bila pembungkusnya ditambahkan kelak.
    const list = Array.isArray(res.data)
      ? res.data
      : (res.data?.items ?? res.data?.categories ?? res.data?.speakers);

    check(
      `${route} publik`,
      res.status === 200 && Array.isArray(list),
      res.error
        ? `tidak bisa dihubungi: ${res.error.message}`
        : `status ${res.status}, daftar ${Array.isArray(list) ? 'ada' : 'hilang'}`,
    );
  }

  // 4. /api/public/live (siaran publik)
  const live = await checkLive();

  // 5. sitemap.xml
  const sitemap = await fetchText(urlOf(WEB, '/sitemap.xml'));
  check(
    'sitemap.xml',
    Boolean(sitemap && sitemap.includes('<urlset')),
    `${urlOf(WEB, '/sitemap.xml')} tidak memuat <urlset>`,
  );

  // 6. robots.txt
  const robots = await fetchText(urlOf(WEB, '/robots.txt'));
  check(
    'robots.txt',
    /^user-agent\s*:/im.test(robots ?? ''),
    `${urlOf(WEB, '/robots.txt')} tidak memuat baris User-Agent`,
  );

  // 7. Endpoint admin menolak tanpa token (401/403)
  const adminUrl = urlOf(BASE, '/api/contents/review?page=1&pageSize=10');
  let adminStatus = 0;
  try {
    const res = await fetch(adminUrl, { headers: { authorization: 'Bearer invalid-token' } });
    adminStatus = res.status;
  } catch {
    adminStatus = 0;
  }
  check(
    'endpoint admin menolak token tidak valid',
    [401, 403].includes(adminStatus),
    `${adminUrl} mengembalikan status ${adminStatus || '(tidak terjangkau)'}`,
  );

  // 8. Halaman beranda
  await checkPage('halaman beranda web', '/');

  // 9. PWA: manifest, ikon, service worker
  await checkManifest();
  await checkServiceWorker();

  // 10. Halaman PWA dan siaran
  await checkPage('halaman /offline', '/offline', 'Anda sedang offline');
  await checkPage('halaman /simpanan', '/simpanan', 'Kajian yang Anda tandai tersimpan');
  const siaran = await checkPage('halaman /siaran', '/siaran', 'Jadwal mingguan');

  if (siaran) {
    const labels = ['Sedang mengudara', 'Sedang tidak mengudara', 'Sesuai jadwal'];
    const shown = labels.find((label) => siaran.body.includes(label));

    check(
      'halaman /siaran menampilkan status siaran',
      Boolean(shown),
      `tidak memuat salah satu label status (${labels.join(', ')})`,
    );

    if (live && typeof live.title === 'string' && live.title.length > 0) {
      check(
        'judul siaran publik tampil di /siaran',
        siaran.body.includes(live.title),
        `judul "${live.title}" dari API tidak muncul — cache web mungkin belum menyegarkan`,
      );
    }
  }

  console.log('');

  if (failures.length > 0) {
    console.error(`Gagal: ${failures.length} cek belum lolos`);
    failures.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }

  console.log('Semua cek lolos.');
}

main().catch((error) => {
  console.error('Gagal menjalankan smoke:', error);
  process.exit(1);
});
