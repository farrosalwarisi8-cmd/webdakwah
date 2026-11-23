import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api/public', () => ({ getPublicContent: vi.fn() }));

import { getPublicContent } from './api/public';
import { absoluteUrl, contentMetadata } from './seo';

const mocked = vi.mocked(getPublicContent);

function content(overrides: Record<string, unknown> = {}) {
  return {
    type: 'VIDEO',
    slug: 'adab-ilmu',
    title: 'Adab Menuntut Ilmu',
    excerpt: 'Ringkasan singkat.',
    mediaUrl: 'https://www.youtube.com/watch?v=abc123',
    transcript: null,
    publishedAt: '2026-11-20T10:00:00.000Z',
    author: { fullName: 'Tim WebDakwah' },
    speaker: null,
    ...overrides,
  } as never;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('absoluteUrl', () => {
  it('mengubah path relatif menjadi URL absolut', () => {
    expect(absoluteUrl('/artikel/adab', 'https://contoh.com')).toBe(
      'https://contoh.com/artikel/adab',
    );
    expect(absoluteUrl('artikel/adab', 'https://contoh.com/')).toBe(
      'https://contoh.com/artikel/adab',
    );
  });

  it('membiarkan URL yang sudah absolut', () => {
    expect(absoluteUrl('https://sumber.example/x', 'https://contoh.com')).toBe(
      'https://sumber.example/x',
    );
  });

  it('mengembalikan nilai asli bila basis tidak sah', () => {
    expect(absoluteUrl('/artikel/adab', 'bukan-url')).toBe('/artikel/adab');
  });

  it('memakai NEXT_PUBLIC_SITE_URL bila tersedia', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://webdakwah.example');

    expect(absoluteUrl('/audio/kajian')).toBe('https://webdakwah.example/audio/kajian');
  });
});

describe('contentMetadata', () => {
  it('memakai URL kanonik absolut dan gambar statis, bukan berkas media', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://webdakwah.example');
    mocked.mockResolvedValue(content());

    const meta = await contentMetadata('VIDEO', 'adab-ilmu');
    const jsonLd = JSON.parse(String(meta.other?.['application/ld+json']));
    const graph = jsonLd['@graph'] as { url?: string }[];

    expect(meta.alternates?.canonical).toBe('https://webdakwah.example/video/adab-ilmu');
    expect(meta.openGraph?.url).toBe('https://webdakwah.example/video/adab-ilmu');
    expect(meta.openGraph?.images).toEqual([
      expect.objectContaining({ url: 'https://webdakwah.example/images/og-video.jpg' }),
    ]);
    expect(graph.every((node) => !node.url || node.url.startsWith('https://'))).toBe(true);
  });

  it('menonaktifkan indeks bila konten gagal dimuat', async () => {
    mocked.mockRejectedValue(new Error('gagal'));

    const meta = await contentMetadata('ARTICLE', 'tidak-ada');

    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toBeUndefined();
  });
});
