import type { Metadata } from 'next';

import { ContentListPage } from '@/components/public/content-list-page';
import { CONTENT_SECTIONS, readPage } from '@/lib/content-routes';

export const metadata: Metadata = {
  title: CONTENT_SECTIONS.LINK.title,
  description: CONTENT_SECTIONS.LINK.description,
  alternates: { canonical: '/rujukan' },
};

export default async function RujukanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;

  return <ContentListPage type="LINK" page={readPage(page)} />;
}
