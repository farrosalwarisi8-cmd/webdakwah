import { PageSkeleton } from '@/components/public/page-skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageSkeleton variant="dashboard" rows={1} />
    </main>
  );
}
