import { CONTENT_TYPE_LABELS, type ContentType } from '@webdakwah/shared';
import { BookOpen, Headphones, Link2, Video, type LucideIcon } from 'lucide-react';

/**
 * Satu sumber untuk warna, ikon, dan label tiap jenis konten. Semua kartu,
 * badge, dan panel media mengambil dari sini agar tidak ada warna yang
 * tersebar dan menyimpang dari palet brand.
 */
export interface ContentTypeVisual {
  label: string;
  icon: LucideIcon;
  badge: string;
  iconWrap: string;
  accent: string;
  mediaPanel: string;
  action: string;
  featuredCta: string;
}

export const CONTENT_TYPE_VISUALS: Record<ContentType, ContentTypeVisual> = {
  ARTICLE: {
    label: CONTENT_TYPE_LABELS.ARTICLE,
    icon: BookOpen,
    badge: 'bg-brand-50 text-brand-800',
    iconWrap: 'bg-brand-50 text-brand-700',
    accent: 'bg-brand-700',
    mediaPanel: 'bg-brand-900',
    action: 'Baca artikel',
    featuredCta: 'Baca sekarang',
  },
  AUDIO: {
    label: CONTENT_TYPE_LABELS.AUDIO,
    icon: Headphones,
    badge: 'bg-accent-100 text-accent-900',
    iconWrap: 'bg-accent-100 text-accent-700',
    accent: 'bg-accent-500',
    mediaPanel: 'bg-ink-950',
    action: 'Simak audio',
    featuredCta: 'Simak sekarang',
  },
  VIDEO: {
    label: CONTENT_TYPE_LABELS.VIDEO,
    icon: Video,
    badge: 'bg-sea-50 text-sea-800',
    iconWrap: 'bg-sea-50 text-sea-700',
    accent: 'bg-sea-500',
    mediaPanel: 'bg-sea-900',
    action: 'Tonton video',
    featuredCta: 'Tonton sekarang',
  },
  LINK: {
    label: CONTENT_TYPE_LABELS.LINK,
    icon: Link2,
    badge: 'bg-ink-100 text-ink-700',
    iconWrap: 'bg-ink-100 text-ink-600',
    accent: 'bg-ink-400',
    mediaPanel: 'bg-ink-800',
    action: 'Lihat rujukan',
    featuredCta: 'Buka rujukan',
  },
};

/** Domain asli dari mediaUrl, dipakai sebagai badge sumber pada kartu tautan. */
export function domainFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const host = new URL(value).hostname.replace(/^www\./i, '');

    return host || null;
  } catch {
    return null;
  }
}
