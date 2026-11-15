import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublicListByFilter, getPublicSpeakers } from '@/lib/api/public';
import { TaxonomyListPage } from '@/components/public/taxonomy-list-page';

export const metadata: Metadata = { title: 'Penceramah' };

export default async function PenceramahPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? '1') || 1;

  const speakers = await getPublicSpeakers().catch(() => []);
  const speaker = speakers.find((item) => item.slug === slug);

  if (!speaker) {
    notFound();
  }

  const list = await getPublicListByFilter({ speaker: slug }, page).catch(() => ({
    items: [],
    page,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  }));

  return (
    <TaxonomyListPage
      title={speaker.name}
      description={`Konten terbit oleh ${speaker.name}.`}
      list={list}
      page={page}
      basePath={`/penceramah/${slug}`}
    />
  );
}
