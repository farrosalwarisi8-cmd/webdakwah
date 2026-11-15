import type { Metadata } from 'next';

import { ContentListPage } from '@/components/public/content-list-page';
import { CONTENT_SECTIONS, readPage } from '@/lib/content-routes';

export const metadata: Metadata = {
  title: CONTENT_SECTIONS.AUDIO.title,
  description: CONTENT_SECTIONS.AUDIO.description,
  alternates: { canonical: '/audio' },
};

export default async function AudioPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;

  return <ContentListPage type="AUDIO" page={readPage(page)} />;
}
