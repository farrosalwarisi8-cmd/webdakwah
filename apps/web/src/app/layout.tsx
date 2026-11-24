import type { Metadata, Viewport } from 'next';
import { Amiri, Plus_Jakarta_Sans } from 'next/font/google';

import { AudioMiniPlayer } from '@/components/public/audio-mini-player';
import { AudioProvider } from '@/components/public/audio-provider';
import { PublicBottomNav } from '@/components/public/public-bottom-nav';
import { PwaClient } from '@/components/public/pwa-client';

import './globals.css';

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-amiri',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Tidak ada `force-dynamic` di sini: halaman publik dirender statis/ISR dengan CSP
// tanpa nonce, sedangkan rute privat menandai dirinya sendiri dinamis (CSP nonce).

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WebDakwah — Artikel, Audio Kajian, dan Video Dakwah',
    template: '%s | WebDakwah',
  },
  description:
    'Kumpulan artikel, audio kajian, video pendek, dan tautan rujukan Islam yang dikurasi dan ditinjau sebelum diterbitkan.',
  applicationName: 'WebDakwah',
  appleWebApp: {
    capable: true,
    title: 'WebDakwah',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  authors: [{ name: 'WebDakwah' }],
  keywords: ['dakwah', 'islam', 'kajian', 'artikel islam', 'audio kajian', 'video dakwah'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'WebDakwah',
    title: 'WebDakwah — Artikel, Audio Kajian, dan Video Dakwah',
    description:
      'Kumpulan artikel, audio kajian, video pendek, dan tautan rujukan Islam yang dikurasi dan ditinjau sebelum diterbitkan.',
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#173b32',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${amiri.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">
        <AudioProvider>
          {children}
          <AudioMiniPlayer />
          <PublicBottomNav />
          <PwaClient />
        </AudioProvider>
      </body>
    </html>
  );
}
