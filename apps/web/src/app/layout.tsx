import type { Metadata, Viewport } from 'next';
import { Amiri, Plus_Jakarta_Sans } from 'next/font/google';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WebDakwah — Artikel, Audio Kajian, dan Video Dakwah',
    template: '%s | WebDakwah',
  },
  description:
    'Kumpulan artikel, audio kajian, video pendek, dan tautan rujukan Islam yang dikurasi dan ditinjau sebelum diterbitkan.',
  applicationName: 'WebDakwah',
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
