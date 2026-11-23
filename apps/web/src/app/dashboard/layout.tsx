import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { getViewer } from '@/lib/auth/viewer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const isAdmin = viewer.status === 'authenticated' && viewer.profile?.role === 'ADMIN';
  const pendingApproval =
    viewer.status === 'authenticated' &&
    viewer.profile !== null &&
    viewer.profile.accountStatus !== 'APPROVED';

  return (
    <div className="min-h-dvh bg-surface-soft">
      <DashboardHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-8">
        <DashboardSidebar isAdmin={isAdmin} />
        <div className="min-w-0 flex-1">
          {pendingApproval ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              {viewer.profile?.accountStatus === 'REJECTED'
                ? 'Pendaftaran akun Anda ditolak admin. Anda tetap bisa membaca dashboard, tetapi belum bisa membuat konten.'
                : 'Akun Anda masih menunggu persetujuan admin. Anda sudah bisa masuk dan menyiapkan bahan, tetapi pembuatan konten aktif setelah disetujui.'}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
