import type { Metadata } from 'next';

import { ContentListPage } from '@/components/public/content-list-page';
import { CONTENT_SECTIONS, readPage } from '@/lib/content-routes';

export const metadata: Metadata = {
  title: CONTENT_SECTIONS.VIDEO.title,
  description: CONTENT_SECTIONS.VIDEO.description,
  alternates: { canonical: '/video' },
};

export default async function VideoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;

  return <ContentListPage type="VIDEO" page={readPage(page)} />;
}
