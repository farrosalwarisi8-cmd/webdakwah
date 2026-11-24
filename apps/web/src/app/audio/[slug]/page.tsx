import type { Metadata } from 'next';

import { ContentDetailPage } from '@/components/public/content-detail-page';
import { contentMetadata } from '@/lib/seo';

// HTML detail disimpan sebagai ISR; perubahan konten masuk lewat tag revalidasi.
export const revalidate = 60;

// Tidak ada slug yang dibangun saat build; halaman dibuat saat pertama diminta lalu
// disimpan sebagai ISR. Perubahan konten masuk lewat tag revalidasi.
export function generateStaticParams(): Array<{ slug: string }> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return contentMetadata('AUDIO', slug);
}

export default async function AudioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <ContentDetailPage type="AUDIO" slug={slug} />;
}
