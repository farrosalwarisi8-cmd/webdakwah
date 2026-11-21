/*
 * Service worker WebDakwah: PWA + akses offline.
 *
 * - Halaman publik memakai network-first; salinan terakhir dipakai saat offline.
 * - Aset Next (_next/static) dan ikon memakai cache-first.
 * - Halaman yang disimpan (pesan CACHE_CONTENTS dari klien) diambil lebih dulu
 *   beserta CSS/JS/gambar di dalamnya agar bisa dibaca tanpa koneksi.
 * - Halaman privat (/dashboard, /masuk, /akun, /api) tidak pernah di-cache.
 */

const VERSION = 'v2';
const SHELL_CACHE = `webdakwah-shell-${VERSION}`;
const PAGE_CACHE = `webdakwah-pages-${VERSION}`;
const ASSET_CACHE = `webdakwah-assets-${VERSION}`;
const ACTIVE_CACHES = new Set([SHELL_CACHE, PAGE_CACHE, ASSET_CACHE]);

const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/simpanan',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

const PRIVATE_PREFIXES = ['/dashboard', '/masuk', '/akun', '/api'];
const MAX_ASSETS_PER_PAGE = 40;
const MAX_CRAWLED_ASSETS = 80;
const MAX_ASSET_ENTRIES = 300;
const ASSET_REFERENCE = /\/_next\/static\/[A-Za-z0-9_@%+.,~\-/]+/g;

function isCacheablePath(pathname) {
  return !PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function pageCacheKey(url, isRsc) {
  return `${url.origin}${normalizePath(url.pathname)}${isRsc ? '?__rsc' : ''}`;
}

function isPageRequest(request) {
  return request.mode === 'navigate' || request.headers.get('RSC') === '1';
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function putPage(key, response) {
  const cache = await caches.open(PAGE_CACHE);
  await cache.put(key, response);
}

async function handlePageRequest(request) {
  const isRsc = request.headers.get('RSC') === '1';
  const key = pageCacheKey(new URL(request.url), isRsc);

  try {
    const response = await fetchWithTimeout(request, 6000);

    if (response.ok && response.type === 'basic') {
      await putPage(key, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(key);

    if (cached) {
      return cached;
    }

    // Permintaan RSC mengharapkan payload khusus, bukan dokumen HTML.
    if (isRsc) {
      return new Response('', { status: 503 });
    }

    const offline = await caches.match(OFFLINE_URL);

    if (offline) {
      return offline;
    }

    return new Response('Anda sedang offline. Sambungkan internet lalu coba lagi.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  // Respons Next memakai header Vary, sedangkan request navigasi/aset membawa
  // header berbeda; abaikan Vary agar salinan precache tetap terpakai.
  const cached =
    (await caches.match(request, { ignoreVary: true })) ?? (await cache.match(request));

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return Response.error();
  }
}

function extractAssetUrls(html) {
  const urls = new Set();
  const patterns = [
    /["'](\/_next\/static\/[^"'\\\s]+)["']/g,
    /<(?:img|source)\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)')/gi,
    /<(?:img|source)\b[^>]*\bsrcset=(?:"([^"]+)"|'([^']+)')/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1] ?? match[2];

      if (!value) {
        continue;
      }

      if (pattern.source.includes('srcset')) {
        for (const candidate of value.split(',')) {
          const url = candidate.trim().split(/\s+/)[0];

          if (url) {
            urls.add(url);
          }
        }
      } else {
        urls.add(value);
      }
    }
  }

  return [...urls].slice(0, MAX_ASSETS_PER_PAGE);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxEntries) {
    return;
  }

  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function cacheAsset(rawUrl, baseUrl) {
  let target;

  try {
    target = new URL(rawUrl, baseUrl);
  } catch {
    return;
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return;
  }

  const cache = await caches.open(ASSET_CACHE);

  if (await cache.match(target.toString())) {
    return;
  }

  try {
    const sameOrigin = target.origin === self.location.origin;
    const response = await fetch(
      target.toString(),
      sameOrigin ? { credentials: 'same-origin' } : { mode: 'no-cors' },
    );

    if (response.ok || response.type === 'opaque') {
      await cache.put(target.toString(), response);
    }
  } catch {
    // Aset yang gagal diambil cukup dilewati; halaman tetap tersimpan.
  }
}

async function crawlChunkAssets(rawUrl, baseUrl) {
  const found = [];

  try {
    const target = new URL(rawUrl, baseUrl);

    if (target.origin !== self.location.origin) {
      return found;
    }

    const response = await fetch(target.toString(), { credentials: 'same-origin' });

    if (!response.ok) {
      return found;
    }

    const source = await response.text();

    for (const match of source.matchAll(ASSET_REFERENCE)) {
      found.push(match[0]);

      if (found.length >= MAX_CRAWLED_ASSETS) {
        break;
      }
    }
  } catch {
    // Chunk yang gagal dibaca cukup dilewati.
  }

  return found;
}

async function cachePageAssets(url, prefetchedHtml) {
  try {
    let html = prefetchedHtml;

    if (!html) {
      const response = await fetch(url.toString(), {
        credentials: 'same-origin',
        cache: 'reload',
      });

      if (!response.ok || response.type !== 'basic') {
        return;
      }

      html = await response.text();
    }

    const assets = new Set(extractAssetUrls(html));
    const chunks = [...assets].filter((asset) => asset.endsWith('.js'));
    const crawled = await Promise.allSettled(chunks.map((asset) => crawlChunkAssets(asset, url)));

    for (const result of crawled) {
      if (result.status === 'fulfilled') {
        result.value.forEach((asset) => assets.add(asset));
      }
    }

    await Promise.allSettled([...assets].map((asset) => cacheAsset(asset, url)));
    await trimCache(ASSET_CACHE, MAX_ASSET_ENTRIES);
  } catch {
    // Halaman shell tetap bisa dipakai walau asetnya gagal disiapkan.
  }
}

async function precacheContentPage(input) {
  let url;

  try {
    url = new URL(input, self.location.origin);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin || !isCacheablePath(url.pathname)) {
    return;
  }

  try {
    const response = await fetch(url.toString(), {
      credentials: 'same-origin',
      cache: 'reload',
    });

    if (!response.ok || response.type !== 'basic') {
      return;
    }

    const html = await response.clone().text();
    await putPage(pageCacheKey(url, false), response);
    await cachePageAssets(url, html);
  } catch {
    // Saat offline atau server lambat, halaman dilewati tanpa menggagalkan pesan.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' }))),
      );
      await Promise.allSettled(
        [OFFLINE_URL, '/simpanan'].map((url) =>
          cachePageAssets(new URL(url, self.location.origin)),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('webdakwah-') && !ACTIVE_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || !isCacheablePath(url.pathname)) {
    return;
  }

  if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
    return;
  }

  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});

self.addEventListener('message', (event) => {
  const data = event.data;

  if (!data || data.type !== 'CACHE_CONTENTS' || !Array.isArray(data.urls)) {
    return;
  }

  const urls = data.urls.filter((url) => typeof url === 'string').slice(0, 24);

  event.waitUntil(Promise.allSettled(urls.map((url) => precacheContentPage(url))));
});
