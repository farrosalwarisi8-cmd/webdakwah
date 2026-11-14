import { userProfileSchema, type UserProfile } from '@webdakwah/shared';
import { cache } from 'react';

import { createSupabaseServerClient } from '../supabase/server';

export type Viewer =
  | { status: 'unconfigured' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; email: string; profile: UserProfile | null };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Sesi pengguna untuk Server Component. Role diambil dari API (diverifikasi
 * ulang di server), bukan dari cookie atau metadata yang bisa dipalsukan.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: 'unconfigured' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'anonymous' };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { status: 'authenticated', email: user.email ?? '', profile: null };
  }

  const response = await fetch(`${API_URL}/api/me`, {
    headers: { authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { status: 'authenticated', email: user.email ?? '', profile: null };
  }

  const parsed = userProfileSchema.safeParse(await response.json());

  return {
    status: 'authenticated',
    email: user.email ?? '',
    profile: parsed.success ? parsed.data : null,
  };
});
