interface PageSkeletonProps {
  /** `list` untuk daftar kartu, `detail` untuk halaman baca, `dashboard` untuk panel kerja. */
  variant?: 'list' | 'detail' | 'dashboard';
  /** Baris kartu yang ditampilkan; cukup beberapa agar terasa ringan. */
  rows?: number;
  /** Tampilkan petunjuk bahwa server sedang dibangunkan. */
  connecting?: boolean;
}

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-full bg-ink-100 ${className}`} />;
}

function Card() {
  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-4 sm:p-5">
      <Bar className="h-3 w-24" />
      <Bar className="mt-3 h-5 w-3/4" />
      <Bar className="mt-2 h-3 w-full" />
      <Bar className="mt-1.5 h-3 w-5/6" />
      <div className="mt-4 flex gap-2">
        <Bar className="h-6 w-16" />
        <Bar className="h-6 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton ringan untuk `loading.tsx`. Tanpa data dan tanpa JS klien; hanya
 * memberi bentuk halaman supaya perpindahan terasa sengaja.
 */
export function PageSkeleton({
  variant = 'list',
  rows = 3,
  connecting = false,
}: PageSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Memuat halaman…</span>

      {connecting ? (
        <p className="mb-4 text-sm text-ink-500">Menghubungkan ke server, mohon tunggu sebentar…</p>
      ) : null}

      {variant === 'dashboard' ? (
        <div className="space-y-4">
          <Bar className="h-7 w-56" />
          <Bar className="h-3 w-80 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-ink-200 bg-white p-4">
                <Bar className="h-3 w-16" />
                <Bar className="mt-3 h-6 w-12" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, index) => (
              <Card key={index} />
            ))}
          </div>
        </div>
      ) : variant === 'detail' ? (
        <div className="mx-auto max-w-3xl space-y-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-11/12" />
          <Bar className="h-3 w-40" />
          <div className="mt-6 space-y-2 rounded-3xl border border-ink-200 bg-white p-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Bar key={index} className={index % 3 === 2 ? 'h-3 w-2/3' : 'h-3 w-full'} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Bar className="h-8 w-52" />
          <Bar className="h-3 w-72 max-w-full" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: rows * 2 }).map((_, index) => (
              <Card key={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
