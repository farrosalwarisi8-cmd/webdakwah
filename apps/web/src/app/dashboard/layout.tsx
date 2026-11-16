import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { getViewer } from '@/lib/auth/viewer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const isAdmin = viewer.status === 'authenticated' && viewer.profile?.role === 'ADMIN';

  return (
    <div className="min-h-dvh bg-surface-soft">
      <DashboardHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        <DashboardSidebar isAdmin={isAdmin} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
