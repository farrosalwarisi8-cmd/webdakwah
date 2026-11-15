import type { Metadata } from 'next';

import { ContentDetailPage } from '@/components/public/content-detail-page';
import { contentMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return contentMetadata('LINK', slug);
}

export default async function RujukanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <ContentDetailPage type="LINK" slug={slug} />;
}
