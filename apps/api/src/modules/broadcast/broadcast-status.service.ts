import { Injectable } from '@nestjs/common';
import { isSafeHttpUrl, type LiveStatus } from '@webdakwah/shared';
import { lookup } from 'node:dns/promises';

import { interpretStatus } from './broadcast-status-format.js';

export { interpretStatus };

const TIMEOUT_MS = 3_000;
const MAX_RESPONSE_BYTES = 32 * 1024;
const CACHE_TTL_MS = 30_000;

export type StatusFetcher = (
  url: string,
  init: {
    method: string;
    redirect: 'manual';
    signal: AbortSignal;
    headers: Record<string, string>;
  },
) => Promise<Response>;

export type StatusResolver = (hostname: string) => Promise<string[]>;

export interface StatusCheckOptions {
  fetcher?: StatusFetcher;
  resolver?: StatusResolver;
  now?: () => number;
}

/** True bila alamat IP termasuk loopback, privat, link-local, atau khusus. */
export function isPrivateIp(value: string): boolean {
  const ip = value
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '');

  if (ip.includes(':')) {
    if (ip === '::' || ip === '::1') return true;

    // IPv4-mapped IPv6, mis. ::ffff:127.0.0.1 atau ::ffff:7f00:1.
    if (ip.startsWith('::ffff:')) {
      const rest = ip.slice(7);
      const mapped = /^(\d+\.\d+\.\d+\.\d+)$/.exec(rest);

      if (mapped) return isPrivateIp(mapped[1] ?? '');

      const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(rest);

      if (hex) {
        const high = Number.parseInt(hex[1] ?? '0', 16);
        const low = Number.parseInt(hex[2] ?? '0', 16);

        return isPrivateIp(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
      }

      return true;
    }

    return (
      ip.startsWith('fe80') || // link-local
      ip.startsWith('fc') || // unique local
      ip.startsWith('fd') ||
      ip.startsWith('ff') // multicast
    );
  }

  const parts = ip.split('.').map(Number);
  const [a, b] = parts;

  if (
    parts.length !== 4 ||
    a === undefined ||
    b === undefined ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

/** Menolak localhost, nama internal, dan alamat IP privat. */
export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');

  if (!host) return true;

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.home.arpa')
  ) {
    return true;
  }

  const isIpLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(':');

  return isIpLiteral ? isPrivateIp(host) : false;
}

async function defaultResolver(hostname: string): Promise<string[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
}

async function readLimitedText(response: Response): Promise<string | null> {
  const declaredLength = Number(response.headers.get('content-length') ?? '');

  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    return null;
  }

  if (!response.body) {
    return (await response.text()).slice(0, MAX_RESPONSE_BYTES);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      received += value.byteLength;

      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }

      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  return text + decoder.decode();
}

/**
 * Memeriksa status siaran dari URL yang diatur admin. Gagal, timeout, atau
 * host tidak aman selalu menghasilkan UNKNOWN, bukan error.
 */
export async function checkLiveStatus(
  statusUrl: string,
  options: StatusCheckOptions = {},
): Promise<LiveStatus> {
  // Diperiksa dari server API, jadi http tidak menimbulkan mixed content.
  if (!isSafeHttpUrl(statusUrl)) return 'UNKNOWN';

  let parsed: URL;

  try {
    parsed = new URL(statusUrl);
  } catch {
    return 'UNKNOWN';
  }

  if (parsed.username || parsed.password) return 'UNKNOWN';

  // Port nonstandar diizinkan (server radio sering memakai 8000–9999), tetapi
  // port 0 bukan tujuan yang valid.
  if (parsed.port !== '' && Number(parsed.port) === 0) return 'UNKNOWN';
  if (isPrivateHostname(parsed.hostname)) return 'UNKNOWN';

  const resolver = options.resolver ?? defaultResolver;

  try {
    const addresses = await resolver(parsed.hostname);

    // Semua alamat harus publik; satu alamat privat berarti host ditolak.
    if (addresses.length === 0 || addresses.some((address) => isPrivateIp(address))) {
      return 'UNKNOWN';
    }
  } catch {
    return 'UNKNOWN';
  }

  const fetcher: StatusFetcher = options.fetcher ?? (globalThis.fetch as StatusFetcher);

  try {
    const response = await fetcher(parsed.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json, text/plain;q=0.9' },
    });

    if (!response.ok) return 'UNKNOWN';

    const text = await readLimitedText(response);

    return text === null ? 'UNKNOWN' : interpretStatus(text);
  } catch {
    return 'UNKNOWN';
  }
}

@Injectable()
export class BroadcastStatusService {
  private readonly cache = new Map<string, { expiresAt: number; status: LiveStatus }>();

  async getStatus(statusUrl: string | null | undefined): Promise<LiveStatus> {
    if (!statusUrl) return 'UNKNOWN';

    const now = Date.now();
    const cached = this.cache.get(statusUrl);

    if (cached && cached.expiresAt > now) {
      return cached.status;
    }

    const status = await checkLiveStatus(statusUrl);
    this.cache.set(statusUrl, { status, expiresAt: now + CACHE_TTL_MS });

    return status;
  }
}
