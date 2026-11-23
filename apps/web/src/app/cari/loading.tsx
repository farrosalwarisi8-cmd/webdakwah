import { PageSkeleton } from '@/components/public/page-skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PageSkeleton variant="list" rows={4} />
    </main>
  );
}
