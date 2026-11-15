import type { Metadata } from 'next';

import { ContentListPage } from '@/components/public/content-list-page';
import { CONTENT_SECTIONS, readPage } from '@/lib/content-routes';

export const metadata: Metadata = {
  title: CONTENT_SECTIONS.ARTICLE.title,
  description: CONTENT_SECTIONS.ARTICLE.description,
  alternates: { canonical: '/artikel' },
};

export default async function ArtikelPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;

  return <ContentListPage type="ARTICLE" page={readPage(page)} />;
}
