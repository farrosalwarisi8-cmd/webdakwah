import type { Metadata } from 'next';

import { ContentDetailPage } from '@/components/public/content-detail-page';
import { contentMetadata } from '@/lib/seo';

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
