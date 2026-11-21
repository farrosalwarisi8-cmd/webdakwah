import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WebDakwah — Artikel, Audio Kajian, dan Video Dakwah',
    short_name: 'WebDakwah',
    description:
      'Kumpulan artikel, audio kajian, video pendek, dan tautan rujukan Islam yang dikurasi dan ditinjau sebelum diterbitkan.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'id',
    dir: 'ltr',
    background_color: '#fff9f2',
    theme_color: '#173b32',
    categories: ['education', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
