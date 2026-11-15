import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublicListByFilter, getPublicTags } from '@/lib/api/public';
import { TaxonomyListPage } from '@/components/public/taxonomy-list-page';

export const metadata: Metadata = { title: 'Tag' };

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? '1') || 1;

  const tags = await getPublicTags().catch(() => []);
  const tag = tags.find((item) => item.slug === slug);

  if (!tag) {
    notFound();
  }

  const list = await getPublicListByFilter({ tag: slug }, page).catch(() => ({
    items: [],
    page,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  }));

  return (
    <TaxonomyListPage
      title={`#${tag.name}`}
      description={`Konten terbit dengan tag ${tag.name}.`}
      list={list}
      page={page}
      basePath={`/tag/${slug}`}
    />
  );
}
