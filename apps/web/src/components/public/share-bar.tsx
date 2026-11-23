import type { ContentType } from '@webdakwah/shared';

import { buildSharePayload, canonicalContentUrl, isShareable } from '@/lib/share';

import { ShareButtons } from './share-buttons';

interface ShareBarProps {
  type: ContentType;
  slug: string;
  title: string;
}

/**
 * Pembungkus Server Component: menghitung URL kanonik dan judul di server,
 * sehingga komponen klien hanya menerima data siap pakai. Rujukan eksternal
 * tidak diberi tombol bagikan.
 */
export function ShareBar({ type, slug, title }: ShareBarProps) {
  if (!isShareable(type)) {
    return null;
  }

  const url = canonicalContentUrl(type, slug, process.env.NEXT_PUBLIC_SITE_URL);

  return <ShareButtons {...buildSharePayload(title, url)} />;
}
