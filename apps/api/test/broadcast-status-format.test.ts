import { describe, expect, it, vi } from 'vitest';

import {
  detectStatusFormat,
  interpretStatus,
} from '../src/modules/broadcast/broadcast-status-format.js';
import { checkLiveStatus } from '../src/modules/broadcast/broadcast-status.service.js';

/**
 * Fixture di bawah adalah CONTOH generik, bukan salinan respons radio nyata.
 * Nama kunci mengikuti bentuk statistik umum Shoutcast/Icecast.
 */
const SHOUTCAST_LIVE = {
  streams: [{ sid: 1, streamstatus: 1, currentlisteners: 12 }],
};
const SHOUTCAST_OFFLINE = { streams: [{ sid: 1, streamstatus: 0, currentlisteners: 0 }] };
const ICECAST_LIVE = {
  icestats: {
    admin: 'admin@example.com',
    source: { mount: '/stream', listeners: 4, stream_start: '2026-11-21T03:00:00Z' },
  },
};
const ICECAST_OFFLINE = { icestats: { admin: 'admin@example.com' } };

const publicResolver = vi.fn().mockResolvedValue(['93.184.216.34']);

function resolveWith(body: string, resolver = publicResolver) {
  const fetcher = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
  return checkLiveStatus('https://radio.example.com/status', { fetcher, resolver });
}

describe('adapter format status siaran', () => {
  it('memilih adapter dari struktur respons, bukan URL', () => {
    expect(detectStatusFormat(SHOUTCAST_LIVE)).toBe('SHOUTCAST');
    expect(detectStatusFormat(SHOUTCAST_OFFLINE)).toBe('SHOUTCAST');
    expect(detectStatusFormat(ICECAST_LIVE)).toBe('ICECAST');
    expect(detectStatusFormat(ICECAST_OFFLINE)).toBe('ICECAST');
    expect(detectStatusFormat({ live: true })).toBe('SIMPLE');
    expect(detectStatusFormat({ takDikenal: 1 })).toBeNull();
    expect(detectStatusFormat('live')).toBeNull();
  });

  it('membaca fixture Shoutcast live dan offline', () => {
    expect(interpretStatus(JSON.stringify(SHOUTCAST_LIVE))).toBe('LIVE');
    expect(interpretStatus(JSON.stringify(SHOUTCAST_OFFLINE))).toBe('OFFLINE');
    expect(interpretStatus(JSON.stringify({ streamstatus: 1 }))).toBe('LIVE');
    expect(interpretStatus(JSON.stringify({ streams: [{ streamstatus: '0' }] }))).toBe('OFFLINE');
  });

  it('membaca fixture Icecast live dan offline', () => {
    expect(interpretStatus(JSON.stringify(ICECAST_LIVE))).toBe('LIVE');
    expect(interpretStatus(JSON.stringify(ICECAST_OFFLINE))).toBe('OFFLINE');
    expect(interpretStatus(JSON.stringify({ icestats: { source: null } }))).toBe('OFFLINE');
    expect(
      interpretStatus(
        JSON.stringify({
          icestats: { source: [{ mount: '/a' }, { mount: '/b' }] },
        }),
      ),
    ).toBe('LIVE');
  });

  it('tetap membaca format sederhana dan teks', () => {
    expect(interpretStatus('{"live":true}')).toBe('LIVE');
    expect(interpretStatus('{"on_air":0}')).toBe('OFFLINE');
    expect(interpretStatus('  LIVE ')).toBe('LIVE');
    expect(interpretStatus('offline')).toBe('OFFLINE');
  });

  it('respons rusak atau tak dikenali menjadi UNKNOWN, bukan error', () => {
    expect(interpretStatus('')).toBe('UNKNOWN');
    expect(interpretStatus('{rusak')).toBe('UNKNOWN');
    expect(interpretStatus('{"streamstatus":"mungkin"}')).toBe('UNKNOWN');
    expect(interpretStatus('<html><body>Radio</body></html>')).toBe('UNKNOWN');
    expect(interpretStatus(JSON.stringify({ icestats: { source: 'aneh' } }))).toBe('UNKNOWN');
  });

  it('adapter bekerja lewat pemeriksa status dengan fixture contoh', async () => {
    await expect(resolveWith(JSON.stringify(SHOUTCAST_LIVE))).resolves.toBe('LIVE');
    await expect(resolveWith(JSON.stringify(SHOUTCAST_OFFLINE))).resolves.toBe('OFFLINE');
    await expect(resolveWith(JSON.stringify(ICECAST_LIVE))).resolves.toBe('LIVE');
    await expect(resolveWith(JSON.stringify(ICECAST_OFFLINE))).resolves.toBe('OFFLINE');
    await expect(resolveWith('<html>halaman radio</html>')).resolves.toBe('UNKNOWN');
  });

  it('mengizinkan statusUrl pada port nonstandar', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('live', { status: 200 }));

    await expect(
      checkLiveStatus('http://radio.example.com:8123/status', {
        fetcher,
        resolver: publicResolver,
      }),
    ).resolves.toBe('LIVE');
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
