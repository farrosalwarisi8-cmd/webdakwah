import { redirect } from 'next/navigation';

import { getViewer } from './viewer';

/** Halaman dashboard: pengunjung tanpa sesi dikirim ke login dengan tujuan semula. */
export async function requireViewer(nextPath: string) {
  const viewer = await getViewer();

  if (viewer.status === 'anonymous') {
    redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}
