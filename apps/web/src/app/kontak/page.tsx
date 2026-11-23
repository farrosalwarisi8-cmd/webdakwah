import { Mail, MapPin, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { InfoList, InfoPage, InfoSection } from '@/components/public/info-page';
import { contactChannels, managerName, type ContactChannelKey } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kontak',
  description:
    'Kanal kontak resmi WebDakwah untuk pertanyaan, koreksi konten, dan permintaan data.',
  alternates: { canonical: '/kontak' },
};

const CHANNEL_ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
  address: MapPin,
} as const satisfies Record<ContactChannelKey, unknown>;

export default function KontakPage() {
  const channels = contactChannels();
  const manager = managerName();

  return (
    <InfoPage
      eyebrow="Kontak"
      title="Hubungi pengelola"
      intro="Gunakan kanal resmi berikut untuk pertanyaan umum, koreksi konten, kerja sama, atau permintaan terkait data pribadi Anda."
    >
      <InfoSection title="Kanal resmi">
        {channels.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.key];

              return (
                <li
                  key={channel.key}
                  className="rounded-2xl border border-ink-200 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">
                    <Icon aria-hidden className="size-4" />
                    {channel.label}
                  </div>
                  {channel.href ? (
                    <a
                      href={channel.href}
                      className="mt-2 block break-words text-sm font-medium text-ink-900 underline-offset-4 hover:underline"
                      {...(channel.key === 'whatsapp'
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {channel.value}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-ink-700">{channel.value}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-600">
            <p className="font-medium text-ink-900">Kanal kontak belum diisi pengelola.</p>
            <p className="mt-1">
              Pemilik situs perlu mengisi <code className="font-mono text-xs">SITE_OWNER</code> di{' '}
              <code className="font-mono text-xs">apps/web/src/lib/site.ts</code>. Halaman ini
              sengaja tidak menampilkan alamat atau nomor yang tidak terverifikasi.
            </p>
          </div>
        )}

        {manager ? <p className="text-ink-600">Dikelola oleh {manager}.</p> : null}
      </InfoSection>

      <InfoSection title="Agar laporan cepat ditindaklanjuti">
        <InfoList
          items={[
            'Sertakan tautan halaman atau judul konten yang Anda maksud.',
            'Jelaskan bagian yang keliru beserta sumber pembanding bila ada.',
            'Untuk permintaan penghapusan akun atau data, sebutkan email yang Anda pakai saat mendaftar.',
          ]}
        />
        <p>
          Kami tidak meminta kata sandi, kode verifikasi, atau data pembayaran melalui kanal mana
          pun. Abaikan permintaan seperti itu.
        </p>
      </InfoSection>

      <InfoSection title="Informasi lain">
        <p>
          Ketentuan penggunaan dan cara kami memperlakukan data Anda dijelaskan di{' '}
          <Link
            href="/syarat"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            syarat penggunaan
          </Link>{' '}
          dan{' '}
          <Link
            href="/privasi"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            kebijakan privasi
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
