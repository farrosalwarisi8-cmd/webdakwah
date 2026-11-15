import type { Metadata } from 'next';

import { ContentDetailPage } from '@/components/public/content-detail-page';
import { contentMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return contentMetadata('VIDEO', slug);
}

export default async function VideoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <ContentDetailPage type="VIDEO" slug={slug} />;
}
