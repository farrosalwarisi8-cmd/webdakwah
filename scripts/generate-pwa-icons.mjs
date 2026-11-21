/**
 * Menghasilkan ikon PWA WebDakwah tanpa dependensi tambahan.
 * Jalankan: node scripts/generate-pwa-icons.mjs
 *
 * Motif: lengkung mihrab oranye di atas latar hijau tua, sama dengan lambang
 * di header situs. Ikon maskable dibuat penuh (tanpa sudut transparan) agar
 * aman saat dipotong bentuk apa pun oleh peluncur Android.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/icons');

const INK = [14, 42, 36, 255]; // #0e2a24
const ACCENT = [242, 140, 40, 255]; // #f28c28
const LIGHT = [255, 249, 242, 255]; // #fff9f2

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;

  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }

  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter none

    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      const offset = row + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Lengkung mihrab: setengah lingkaran di atas persegi. Parameter relatif
 * terhadap ukuran kanvas agar satu fungsi dipakai untuk semua ukuran ikon.
 */
function archPixel(size, rounded) {
  const centerX = size / 2;
  const archRadius = size * 0.27;
  const archTop = size * 0.28;
  const archBottom = size * 0.74;
  const thickness = size * 0.09;
  const corner = size * 0.2;

  return (x, y) => {
    if (rounded) {
      const dx = Math.max(corner - x, 0, x - (size - corner));
      const dy = Math.max(corner - y, 0, y - (size - corner));

      if (dx * dx + dy * dy > corner * corner) {
        return [0, 0, 0, 0];
      }
    }

    const insideArch =
      (Math.abs(x - centerX) <= archRadius && y >= archTop && y <= archBottom) ||
      (y <= archTop && Math.hypot(x - centerX, y - archTop) <= archRadius);

    const innerRadius = archRadius - thickness;
    const insideInner =
      (Math.abs(x - centerX) <= innerRadius &&
        y >= archTop + thickness &&
        y <= archBottom - thickness) ||
      (y <= archTop + thickness &&
        Math.hypot(x - centerX, y - (archTop + thickness)) <= innerRadius);

    if (insideArch && !insideInner) {
      return ACCENT;
    }

    if (Math.hypot(x - centerX, y - size * 0.6) <= size * 0.035) {
      return LIGHT;
    }

    return INK;
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const icons = [
  { file: 'icon-192.png', size: 192, rounded: true },
  { file: 'icon-512.png', size: 512, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, rounded: false },
  { file: 'apple-icon-180.png', size: 180, rounded: false },
];

for (const { file, size, rounded } of icons) {
  const png = encodePng(size, archPixel(size, rounded));
  writeFileSync(resolve(OUT_DIR, file), png);
  console.log(`${file} (${size}x${size}, ${png.length} bytes)`);
}
