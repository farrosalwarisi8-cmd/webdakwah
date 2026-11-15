import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { PUBLIC_CONTENT_TAG } from '@/lib/cache-tags';

function secretMatches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'Revalidasi belum dikonfigurasi di server.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-revalidate-secret') ?? '';

  if (!secretMatches(provided, secret)) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
  }

  // expire: 0 membuat data publik langsung basi, tanpa menunggu revalidate 60 detik.
  revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });

  return NextResponse.json({
    revalidated: true,
    tag: PUBLIC_CONTENT_TAG,
    at: new Date().toISOString(),
  });
}
