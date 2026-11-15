import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublicCategories, getPublicListByFilter } from '@/lib/api/public';
import { TaxonomyListPage } from '@/components/public/taxonomy-list-page';

export const metadata: Metadata = { title: 'Kategori' };

export default async function KategoriPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? '1') || 1;

  const categories = await getPublicCategories().catch(() => []);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const list = await getPublicListByFilter({ category: slug }, page).catch(() => ({
    items: [],
    page,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  }));

  return (
    <TaxonomyListPage
      title={category.name}
      description={`Konten terbit dengan kategori ${category.name}.`}
      list={list}
      page={page}
      basePath={`/kategori/${slug}`}
    />
  );
}
