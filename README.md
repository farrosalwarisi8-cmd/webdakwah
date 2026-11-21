# WebDakwah

Website dakwah berbahasa Indonesia: artikel, audio kajian, video pendek, dan tautan rujukan.
Konten ditulis oleh **Kontributor**, lalu ditinjau dan diterbitkan oleh **Admin**.

> Status: **Fase 27 — PWA & akses offline**. Website kini dapat dipasang ke layar utama dan
> menyimpan halaman konten untuk dibaca saat koneksi mati. Fitur fase sebelumnya (taksonomi
> publik, siaran, SEO) tetap berjalan seperti biasa.

## Teknologi

| Bagian          | Teknologi                                                      |
| --------------- | -------------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                                    |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend         | NestJS 12 + Fastify                                            |
| Database & Auth | Supabase (Postgres + Auth), Prisma 7                           |
| Media           | Cloudflare R2 dengan presigned URL                             |
| Deploy          | Web → Vercel, API → Render                                     |

## Struktur Folder

```
webdakwah/
├─ apps/
│  ├─ web/        # Next.js App Router (beranda, halaman baca publik, /masuk, dashboard)
│  └─ api/        # NestJS + Fastify, modul auth, contents & health
│     └─ prisma/  # schema.prisma, migrasi SQL, seed admin
├─ packages/
│  └─ shared/     # Tipe, konstanta (role/status), skema Zod, matriks izin
├─ eslint.config.mjs
├─ turbo.json
└─ tsconfig.base.json
```

`packages/shared` adalah satu-satunya sumber kebenaran untuk aturan yang dipakai kedua app
(daftar role, status konten, tipe konten, validasi URL, pagination, dan matriks izin).

## Autentikasi & Hak Akses

- Login memakai **Supabase Auth** (email + kata sandi). Akun dibuat oleh admin, bukan pendaftaran
  terbuka.
- Role **tidak** disimpan di metadata auth, melainkan di tabel `profiles` (id sama dengan
  `auth.users.id`). Pengguna tidak bisa menaikkan hak aksesnya sendiri.
- Trigger `on_auth_user_created` membuat profil baru otomatis dengan role `CONTRIBUTOR`.
- API memverifikasi Bearer token setiap request (JWKS/ES256, atau HS256 untuk proyek lama), lalu
  `RolesGuard` membaca role **dari database** dan menolak akun yang dinonaktifkan.
- Matriks izin ada di `packages/shared/src/auth/permissions.ts`
  (`content:create`, `content:update-own`, `content:publish`, `content:delete-any`, `users:manage`,
  `taxonomy:manage`, `broadcast:manage`). Kontributor hanya mendapat dua izin pertama.
- `/dashboard`, `/dashboard/konten`, dan `/dashboard/moderasi` dijaga oleh `proxy.ts` (pengganti
  middleware di Next 16). Proxy hanya lapisan kenyamanan; API tetap memverifikasi token sendiri.

## Konten & Alur Review

Status konten: `DRAFT → PENDING_REVIEW → PUBLISHED`, dengan `REJECTED → DRAFT` dan
`PUBLISHED → ARCHIVED`.

- Kontributor menulis artikel, menautkan audio/video/tautan rujukan, dan menyimpannya sebagai draft.
  Draft boleh belum lengkap; kelengkapan diperiksa saat diajukan.
- Konten yang diajukan (`PENDING_REVIEW`) tidak bisa disunting sampai ditarik kembali ke draft.
- Admin meninjau antrean di `/dashboard/moderasi`: **Terbitkan** mengisi `published_at`, atau
  **Tolak** dengan catatan wajib (10–500 karakter). Catatan tampil ke penulis, yang lalu bisa
  memperbaiki dan mengajukan ulang; catatan lama dibersihkan saat diajukan ulang.
- Admin mengelola terbitan di `/dashboard/terbitan`: **Arsipkan** mengubah status ke `ARCHIVED`
  sehingga konten hilang dari seluruh halaman publik, dan **Pulihkan** mengembalikannya ke
  `PUBLISHED` dengan tanggal terbit pertama tetap dipertahankan.
- Penulis hanya bisa membuka, menyunting, dan menghapus kontennya sendiri. Admin bisa membuka
  semua konten dan menyunting yang belum terbit. Kepemilikan dicek di API, bukan hanya UI.
- Slug dibuat otomatis dari judul dengan sufiks acak, jadi tidak perlu diisi manual.
- Audio, video, dan gambar bisa diunggah dari editor ke Cloudflare R2, atau tetap memakai
  tautan http/https. Batas: audio 50 MB (MP3, M4A, AAC, OGG), video 200 MB (MP4, WebM), dan
  gambar 5 MB (JPEG, PNG, WebP, GIF). SVG sengaja tidak diterima untuk gambar isi.
- Konten audio dapat memiliki transkrip teks polos hingga 100.000 karakter. Transkrip hanya
  disimpan untuk jenis AUDIO, tampil dalam accordion di halaman audio, dan terlihat oleh admin
  saat meninjau. Baris baru dipertahankan; teks dirender sebagai teks, bukan HTML.
- Editor mendukung **tabel** (sisip 3×3, tambah/hapus baris dan kolom), tombol **Arab RTL** untuk
  paragraf/judul berbahasa Arab, serta blok **Ayat** dan **Hadis** berisi sumber, teks Arab, dan
  terjemahan. Blok kutipan tampil dengan latar aksen dan font Arab Amiri di halaman publik.
- **Notifikasi review** dibuat otomatis saat konten diajukan (untuk semua admin aktif lain),
  diterbitkan, atau ditolak (untuk penulis). Lonceng di header dashboard menampilkan jumlah yang
  belum dibaca; halaman `/dashboard/notifikasi` memiliki daftar, penanda baru, paginasi, tombol
  **Tandai dibaca**, dan **Tandai semua dibaca**. Setiap pengguna hanya bisa membaca dan menandai
  notifikasinya sendiri. Pembuatan notifikasi bersifat best-effort: kegagalan notifikasi tidak
  membatalkan terbit/tolak yang sudah berhasil.

### Sanitasi isi konten

Isi konten disanitasi dengan allowlist di API, baik saat disimpan maupun saat dibaca oleh
serializer publik. Data lama yang tersimpan sebelum aturan ini juga dibersihkan ketika dikirim.

- Tag yang diizinkan: `p`, `br`, `h2`–`h4`, `strong`, `em`, `u`, `s`, daftar (`ul`/`ol`/`li`),
  `blockquote`, `div`, `a`, `hr`, `img`, dan tabel.
- Blok Ayat/Hadis hanya memakai `div.quote-block` dengan `data-quote-block` dan `data-kind`
  (`AYAH`/`HADITH`, nilai lain dinormalkan). Kelas paragraf dibatasi ke `quote-source`,
  `quote-arabic`, dan `quote-translation`; `dir` hanya dipertahankan untuk `rtl`. Kelas, atribut
  `data-*` lain, dan event handler di luar itu dibuang.
- Tautan hanya boleh `http://` atau `https://`; `javascript:`, `data:`, dan URL relatif dibuang.
  Setiap tautan aman mendapat `target="_blank"` dan `rel="noopener noreferrer nofollow"`.
- Gambar hanya boleh `src` berprotokol `http://`/`https://` dengan atribut `src`, `alt`, dan
  `title`. Sanitizer menambahkan `loading="lazy"`, `decoding="async"`, dan
  `referrerpolicy="no-referrer"`. Gambar tanpa URL aman dibuang, termasuk `data:`, `javascript:`,
  URL protokol-relatif, dan SVG inline.
- `style`, `script`, `iframe`, dan atribut event seperti `onclick`/`onerror` dibuang.
- Batas isi: 50.000 karakter dan 2.000 elemen HTML.
- Artikel teks polos lama tetap tampil sebagai teks; karakter `<` di-escape dan baris baru menjadi
  `<br>`, bukan dianggap HTML.

Endpoint API (semua butuh Bearer token):

| Metode & path                         | Keterangan                                      |
| ------------------------------------- | ----------------------------------------------- |
| `GET /api/contents/mine`              | Daftar konten sendiri (`?status=`, `?page=`)    |
| `GET /api/contents/:id`               | Detail untuk pemilik atau admin                 |
| `POST /api/contents`                  | Buat draft baru                                 |
| `PATCH /api/contents/:id`             | Sunting draft/konten ditolak                    |
| `POST /api/contents/:id/submit`       | Ajukan review (validasi kelengkapan)            |
| `POST /api/contents/:id/withdraw`     | Tarik kembali ke draft                          |
| `DELETE /api/contents/:id`            | Hapus draft/konten ditolak                      |
| `GET /api/contents/review`            | Antrean `PENDING_REVIEW` (admin saja)           |
| `POST /api/contents/:id/publish`      | Terbitkan konten (admin saja)                   |
| `POST /api/contents/:id/reject`       | Tolak + catatan wajib (admin saja)              |
| `GET /api/contents/managed`           | Daftar terbit/arsip (admin saja)                |
| `POST /api/contents/:id/archive`      | Arsipkan konten terbit (admin saja)             |
| `POST /api/contents/:id/unarchive`    | Pulihkan konten arsip (admin saja)              |
| `POST /api/uploads/presign`           | URL PUT sementara ke R2 (semua pengguna aktif)  |
| `GET /api/broadcast/settings`         | Pengaturan siaran (admin saja)                  |
| `PATCH /api/broadcast/settings`       | Ubah pengaturan siaran (admin saja)             |
| `GET /api/broadcast/schedules`        | Semua jadwal siaran (admin saja)                |
| `POST /api/broadcast/schedules`       | Tambah jadwal siaran (admin saja)               |
| `PATCH /api/broadcast/schedules/:id`  | Ubah jadwal siaran (admin saja)                 |
| `DELETE /api/broadcast/schedules/:id` | Hapus jadwal siaran (admin saja)                |
| `GET /api/notifications?page=`        | Notifikasi milik pengguna + jumlah belum dibaca |
| `GET /api/notifications/unread-count` | Jumlah notifikasi belum dibaca                  |
| `POST /api/notifications/:id/read`    | Tandai satu notifikasi milik sendiri            |
| `POST /api/notifications/read-all`    | Tandai semua notifikasi sendiri sebagai dibaca  |

Endpoint publik di bawah ini **tidak butuh login** dan hanya mengembalikan konten `PUBLISHED`.
Responsnya memakai skema terpisah (`publicContentSummarySchema`/`publicContentDetailSchema`) yang
tidak memuat email penulis, catatan review, atau status internal.

| Metode & path                           | Keterangan                                         |
| --------------------------------------- | -------------------------------------------------- |
| `GET /api/public/contents?type=&page=`  | Daftar konten terbit (filter jenis opsional)       |
| `GET /api/public/contents/:slug`        | Detail konten terbit berdasarkan slug; lainnya 404 |
| `GET /api/public/highlights`            | Satu terbitan terbaru per jenis untuk beranda      |
| `GET /api/public/search?q=&type=&page=` | Cari judul/ringkasan/isi konten terbit (q 2–100)   |
| `GET /api/public/live`                  | Pengaturan siaran publik, jadwal terdekat, status  |
| `GET /api/categories`                   | Kategori yang punya konten terbit (`name`, `slug`) |
| `GET /api/tags`                         | Tag yang punya konten terbit (`name`, `slug`)      |
| `GET /api/speakers`                     | Penceramah yang punya konten terbit                |

Daftar taksonomi hanya memuat `name` dan `slug` agar id internal tidak bocor. `GET
/api/categories/options`, `GET /api/speakers/options`, dan seluruh rute `manage`, `POST`, `PATCH`,
`DELETE` tetap membutuhkan login (admin untuk perubahan).

## Unggah Media ke R2

- `POST /api/uploads/presign` menerima `{ contentType, size }` dari pengguna yang sudah login,
  lalu mengembalikan `{ uploadUrl, publicUrl, key, expiresIn }`. URL PUT berlaku 10 menit.
- Browser mengunggah berkas **langsung ke R2** lewat `PUT` (dengan progres), jadi berkas tidak
  melewati API dan batas body API tetap kecil. Setelah selesai, kolom tautan media terisi
  otomatis dengan `publicUrl`; gambar isi langsung disisipkan ke editor.
- Server memvalidasi ulang jenis dan ukuran (allowlist MIME + batas per jenis); permintaan yang
  tidak sesuai ditolak `400`. Bila kredensial R2 belum lengkap, endpoint mengembalikan `503`.
- Objek disimpan sebagai `media/<user-id>/<uuid>.<ext>`; `Content-Type` dan `Content-Length`
  ikut ditandatangani sehingga isi tidak bisa mengganti jenis/ukuran. Checksum CRC32 otomatis
  dari AWS SDK dimatikan agar unggahan berkas asli tidak ditolak.
- Bucket perlu **CORS** yang mengizinkan `PUT` dari origin web (mis. `https://domain-anda.com`)
  dengan header `Content-Type`, dan akses baca publik lewat domain kustom atau `r2.dev`.
- Objek R2 dihapus otomatis saat tautan media konten diganti atau dikosongkan, dan saat konten
  dihapus. Objek diarsipkan tidak dihapus. Hanya berkas pada folder `media/<penulis-konten>/`
  milik bucket ini yang disentuh; URL eksternal dibiarkan. Gambar yang disisipkan ke dalam isi
  tidak dilacak sebagai `mediaUrl`, jadi menghapusnya dari isi belum menghapus objek R2 otomatis.
- Untuk uji lokal tanpa akun R2, isi `R2_ENDPOINT` ke server S3-compatible seperti MinIO dan
  set `forcePathStyle` otomatis aktif. Alur presign/PUT/GET sudah diuji dengan endpoint S3
  tiruan; verifikasi terhadap R2 asli menunggu kredensial produksi.

## Halaman Publik

- `/artikel`, `/audio`, `/video`, `/rujukan` — daftar konten terbit per jenis, 12 per halaman.
- `/artikel/[slug]`, `/audio/[slug]`, `/video/[slug]`, `/rujukan/[slug]` — halaman baca dengan
  metadata judul, deskripsi, canonical, dan OpenGraph. URL memakai slug, bukan UUID.
- Beranda menampilkan satu terbitan terbaru per jenis; bila belum ada, tampil ajakan menunggu.
- `/kategori/[slug]`, `/tag/[slug]`, dan `/penceramah/[slug]` menampilkan konten terbit yang
  terkait, 12 per halaman. Slug yang tidak dikenal atau taksonomi tanpa konten terbit → 404.
  Chip kategori/tag di beranda dan tautan kategori pada halaman baca mengarah ke halaman ini.
- `/siaran` menampilkan siaran langsung radio mitra: pemutar memakai audio provider global,
  status siaran, jadwal mingguan WIB, acara khusus, dan tautan Telegram. Bila radio memakai
  alamat http atau mode `EXTERNAL`, tombol membuka tab baru dengan `rel="noopener noreferrer"`.
  API lambat atau mati tidak membuat halaman error; tampil pesan ramah.
- `/cari` mencari judul, ringkasan, dan isi konten terbit, dengan filter jenis dan paginasi.
  Halaman hasil ditandai `noindex` agar tidak membanjiri mesin pencari, dan tautan cari tersedia
  di header.
- Konten berstatus `ARCHIVED` otomatis tidak muncul di daftar, detail, sitemap, highlight,
  maupun hasil pencarian.
- Pencarian memakai `ILIKE` (`contains` + `mode: insensitive`). Untuk data besar, tambahkan
  indeks trigram Postgres pada kolom yang dicari.
- `/sitemap.xml` dan `/robots.txt` dihasilkan otomatis. Dashboard, akun, dan halaman masuk
  dikecualikan dari indeks mesin pencari.
- Data diambil dengan revalidasi 60 detik sebagai cadangan. Setelah konten terbit, diarsipkan,
  atau dipulihkan, API memanggil webhook `POST /api/revalidate` agar cache publik langsung
  dibersihkan tanpa menunggu 60 detik.
- Bila API sedang mati, halaman tetap tampil dengan pesan ramah, bukan error 500.

### Revalidasi cache (`apps/web/src/app/api/revalidate/route.ts`)

- `POST /api/revalidate` dengan header `x-revalidate-secret: <REVALIDATE_SECRET>`.
- `200` bila berhasil, `401` bila rahasia salah, `503` bila `REVALIDATE_SECRET` belum diisi.
- Tag cache `public-content` dipakai semua fetch konten publik (daftar, detail, highlight,
  sitemap), sehingga satu panggilan menyegarkan seluruh halaman.
- Aktif hanya bila API dan web sama-sama mengisi `FRONTEND_REVALIDATE_URL` dan
  `REVALIDATE_SECRET` (minimal 16 karakter). Tanpa itu, konten baru muncul paling lama 60 detik
  kemudian dan aksi admin tetap berhasil (webhook bersifat best-effort).

## Notifikasi Review (Fase 21)

Tabel `notifications` menyimpan satu baris per penerima dengan `type`
(`CONTENT_SUBMITTED`, `CONTENT_PUBLISHED`, `CONTENT_REJECTED`), judul, pesan, tautan dashboard,
`content_id`, dan status baca. RLS membatasi `SELECT`/`UPDATE` ke `auth.uid() = user_id`; API
tetap menambahkan filter `user_id` pada setiap query.

- **Diajukan** → semua profil `ADMIN` yang aktif selain pengaju mendapat notifikasi menuju
  `/dashboard/moderasi/<id>`.
- **Diterbitkan / ditolak** → penulis mendapat notifikasi menuju `/dashboard/konten/<id>`;
  penolakan menyertakan catatan admin (dipotong hingga batas kolom). Admin yang menerbitkan
  kontennya sendiri tidak mengirim notifikasi ke diri sendiri.
- Judul dan pesan disalin saat notifikasi dibuat, jadi riwayat tetap terbaca bila konten berubah.
  Menghapus konten ikut menghapus notifikasi terkait melalui `ON DELETE CASCADE`.
- Notifikasi dibuat setelah transisi konten berhasil dan dibungkus best-effort: kegagalan menulis
  notifikasi dicatat sebagai peringatan, bukan menggagalkan aksi utama.

## Siaran Langsung (Fase 19)

Server radio **tidak** dibuat di proyek ini. Radio mitra memberi akses siaran kepada penyiarnya,
dan website hanya menyimpan **alamat dengar publik** serta jadwal. Kredensial panel radio atau
akun siaran tidak pernah ditulis di kode, database, `.env.example`, README, atau log.

Model:

- `LiveStream` — satu baris pengaturan: `title`, `description`, `streamUrl`, `playMode`
  (`EMBED`/`EXTERNAL`), `statusUrl`, `telegramUrl`, `isEnabled`, `updatedAt`.
- `BroadcastSchedule` — `title`, `speakerId` (opsional), `dayOfWeek` (0–6) **atau** `date`
  (salah satu wajib, ditegakkan juga oleh constraint database), `startTime` (`HH:mm` WIB),
  `durationMin`, `notes`, `isActive`.
- `BroadcastWatching` — `profileId`, `channelId`, `createdAt`; satu baris unik per pasangan
  profil–channel. Dipakai sebagai penghitung pengikut publik dan daftar admin.

Aturan validasi (di `packages/shared`):

- `streamUrl` boleh dikosongkan selama siaran belum aktif; bila diisi wajib `http`/`https` dan
  tanpa kredensial tertanam (`user:pass@`). Mengaktifkan siaran mewajibkan alamat dengar.
- Alamat `https` boleh `EMBED`. Alamat `http` selalu dipaksa `EXTERNAL` karena browser memblokir
  audio http di halaman https (mixed content). Form admin menampilkan peringatan ini.
- `statusUrl` dan `telegramUrl` hanya boleh `https` tanpa kredensial.
- Pemeriksaan status dijalankan di server: hanya https, tanpa redirect, timeout 3 detik, respons
  maksimal 32 KB, cache ±30 detik. Nama host/IP privat, loopback, link-local, dan alamat hasil DNS
  yang mengarah ke jaringan privat ditolak (proteksi SSRF). Kegagalan menghasilkan
  `UNKNOWN` → "Status tidak tersedia", bukan error.
- `GET /api/public/live` hanya mengembalikan `id` channel (untuk tombol ikuti), `isEnabled`,
  `title`, `description`, `streamUrl`, `playMode`, `telegramUrl`, jadwal aktif terdekat, dan
  `liveStatus`; `statusUrl` serta data internal tidak pernah ikut. Endpoint memakai throttle
  sendiri dan cache pendek.
- Pengikut siaran: `GET /api/broadcast/public/:channelId/watching-count` (jumlah saja, tanpa
  login), `GET/POST/DELETE /api/broadcast/watch/:channelId` (status dan aksi untuk pengguna
  login), serta `GET /api/broadcast/manage/watchers/:channelId` (daftar nama/email, khusus
  `broadcast:manage`). Ikuti/berhenti bersifat idempoten, hanya channel aktif yang bisa diikuti,
  dan baris ikut terhapus saat profil atau channel dihapus (`ON DELETE CASCADE`).
- Halaman `/siaran` memakai revalidasi 30 detik, memutar audio lewat provider global yang sudah
  ada (`preload`/tanpa autoplay), dan tetap tampil dengan pesan ramah bila API lambat atau mati.
- Halaman `/siaran` menampilkan tombol **Ikuti siaran** (masuk dulu bila belum login) beserta
  jumlah pengikut; jumlah tetap tampil walau pengunjung belum masuk.
- Dashboard `/dashboard/siaran` (admin saja, izin `broadcast:manage`) berisi form pengaturan,
  CRUD jadwal, dan daftar pengikut (nama, email, waktu bergabung) dengan paginasi.

Panduan untuk penyiar non-teknis (Winamp Shoutcast DSP, BUTT, uji siaran, dan siaran manual ke
Telegram lewat OBS) ada di [`docs/siaran-radio.md`](docs/siaran-radio.md). Dokumen itu memakai
placeholder `<diisi dari pengelola radio>` dan tidak memuat kredensial.

## PWA & Akses Offline (Fase 27)

- `apps/web/src/app/manifest.ts` menyajikan `/manifest.webmanifest` (`display: standalone`,
  warna tema `#173b32`) dengan ikon 192/512, ikon maskable, dan ikon Apple 180.
- `apps/web/public/sw.js` mendaftarkan service worker hanya saat produksi (`next start`), agar
  hot reload saat `next dev` tidak terganggu.
- Strategi cache:
  - Halaman publik: **network-first** dengan batas tunggu 6 detik, lalu salinan cache, lalu
    `/offline` bila tidak ada salinan.
  - `/_next/static`, ikon, gambar, dan font: **cache-first** (maksimal 300 entri aset).
  - `/dashboard`, `/masuk`, `/akun`, dan `/api`: tidak pernah disimpan, selalu jaringan.
- Halaman `/offline` menampilkan tautan ke `/simpanan` dan beranda, ditandai `noindex`.
- Tombol **Simpan** menyimpan ringkasan konten ke `localStorage`, lalu meminta service worker
  menyimpan halaman detail beserta asetnya. Membuka `/simpanan` menyegarkan cache semua halaman
  tersimpan (maksimal 24 halaman, 40 aset per halaman).
- Banner "Anda sedang offline" dan kartu **Pasang aplikasi** muncul dari
  `apps/web/src/components/public/pwa-client.tsx`; penolakan kartu diingat lewat
  `localStorage` (`webdakwah:install-dismissed`).
- `next.config.ts` memberi `Cache-Control: no-cache` + `Service-Worker-Allowed: /` untuk `/sw.js`
  dan cache immutable 7 hari untuk `/icons/*`.

Menguji secara lokal (service worker tidak aktif di `next dev`):

```bash
pnpm --filter web build
pnpm --filter web start
# buka http://localhost:3000, simpan satu konten, lalu matikan koneksi dan buka /simpanan
```

Ikon PNG dibuat tanpa dependensi tambahan:

```bash
node scripts/generate-pwa-icons.mjs
```

## Menjalankan Secara Lokal

Prasyarat: Node.js 24 (lihat `.nvmrc`), pnpm 12, dan satu project Supabase (gratis).

```bash
# 1. Install dependensi (sekaligus generate Prisma Client)
pnpm install

# 2. Siapkan environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Isi kredensial Supabase di kedua file env:
#    - API: DATABASE_URL, DIRECT_URL, SUPABASE_URL
#    - Web: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
#    Nilai didapat dari Supabase Dashboard → Project Settings → Database / API.

# 4. Terapkan skema database
pnpm --filter api db:migrate

# 5. Buat akun admin pertama (isi SEED_ADMIN_* + SUPABASE_SERVICE_ROLE_KEY di .env)
pnpm --filter api db:seed

# 6. Jalankan keduanya (web :3000, api :3001)
pnpm dev
```

Jalankan salah satu saja bila perlu:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

Cek API: <http://localhost:3001/health> → `{"status":"ok", ...}`
Endpoint bisnis berada di prefiks `/api`, mis. `GET /api/me`.
Login: <http://localhost:3000/masuk>
Editor konten: <http://localhost:3000/dashboard/konten>
Halaman publik: <http://localhost:3000/artikel>, `/audio`, `/video`, `/rujukan`, `/cari`

Tanpa kredensial Supabase, aplikasi tetap bisa di-build dan beranda/health tetap jalan;
halaman login akan menampilkan pesan bahwa autentikasi belum dikonfigurasi.

## Perintah Penting

```bash
pnpm build         # build semua package (turbo, urut dependensi)
pnpm typecheck     # TypeScript tanpa emit untuk semua package
pnpm lint          # ESLint untuk seluruh repo
pnpm test          # tes unit aturan akses (Vitest)
pnpm format        # Prettier --write
pnpm format:check  # cek format
pnpm smoke         # uji asap penerbitan (API + web, konten publik, taksonomi, siaran, sitemap, admin 401)
node scripts/generate-pwa-icons.mjs  # buat ulang ikon PWA di apps/web/public/icons
```

Prisma (dijalankan dari root):

```bash
pnpm --filter api db:generate   # generate Prisma Client ke src/generated/prisma
pnpm --filter api db:migrate    # prisma migrate deploy (produksi/CI)
pnpm --filter api db:migrate:dev# buat migrasi baru saat mengubah schema
pnpm --filter api db:seed       # buat/naikkan akun admin dari SEED_ADMIN_*
pnpm --filter api db:studio     # Prisma Studio
```

## Environment Variables

Salin dari file `.env.example` di masing-masing app. Tidak ada nilai rahasia yang disimpan di repo.

### API (`apps/api/.env`)

| Variabel                                       | Wajib       | Default                 | Keterangan                                    |
| ---------------------------------------------- | ----------- | ----------------------- | --------------------------------------------- |
| `NODE_ENV`                                     | tidak       | `development`           | `development` \| `test` \| `production`       |
| `PORT`                                         | tidak       | `3001`                  | Port HTTP                                     |
| `HOST`                                         | tidak       | `0.0.0.0`               | Bind address (Render butuh `0.0.0.0`)         |
| `LOG_LEVEL`                                    | tidak       | `info`                  | Level logger Fastify/Pino                     |
| `FRONTEND_ORIGINS`                             | tidak       | `http://localhost:3000` | Origin CORS, dipisah koma                     |
| `DATABASE_URL`                                 | ya (Fase 2) | —                       | Postgres via pooler Supabase (port 6543)      |
| `DIRECT_URL`                                   | ya (Fase 2) | —                       | Koneksi langsung untuk Prisma CLI/migrasi     |
| `SUPABASE_URL`                                 | ya (Fase 2) | —                       | Base URL project; juga dipakai membentuk JWKS |
| `SUPABASE_JWKS_URL`                            | tidak       | `<SUPABASE_URL>/...`    | Override endpoint JWKS                        |
| `SUPABASE_JWT_SECRET`                          | tidak       | —                       | Hanya untuk proyek lama dengan token HS256    |
| `SUPABASE_SERVICE_ROLE_KEY`                    | hanya seed  | —                       | Kunci server; jangan dipakai di runtime web   |
| `SEED_ADMIN_EMAIL`                             | hanya seed  | —                       | Email admin pertama                           |
| `SEED_ADMIN_PASSWORD`                          | hanya seed  | —                       | Minimal 8 karakter                            |
| `R2_ACCOUNT_ID`                                | untuk media | —                       | ID akun Cloudflare                            |
| `R2_ACCESS_KEY_ID`                             | untuk media | —                       | Access key token R2                           |
| `R2_SECRET_ACCESS_KEY`                         | untuk media | —                       | Secret access key R2                          |
| `R2_BUCKET_NAME`                               | untuk media | —                       | Nama bucket media                             |
| `R2_PUBLIC_BASE_URL`                           | untuk media | —                       | URL publik bucket, tanpa `/` di akhir         |
| `R2_ENDPOINT`                                  | opsional    | —                       | Endpoint S3 kustom (MinIO) untuk uji lokal    |
| `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET` | opsional    | —                       | Pemicu revalidasi cache web (Fase 7)          |
| `THROTTLE_GLOBAL_PER_MIN`                      | tidak       | `600`                   | Batas laju publik per IP (permintaan/menit)   |
| `THROTTLE_UPLOAD_PER_MIN`                      | tidak       | `10`                    | Batas laju presign per pengguna               |
| `THROTTLE_SEARCH_PER_MIN`                      | tidak       | `600`                   | Batas laju pencarian publik per IP            |
| `THROTTLE_SESSION_PER_MIN`                     | tidak       | `60`                    | Batas laju `GET /api/me` per pengguna         |
| `THROTTLE_LIVE_PER_MIN`                        | tidak       | `120`                   | Batas laju `GET /api/public/live` per IP      |
| `UPLOAD_QUOTA_PER_HOUR`                        | tidak       | `20`                    | Kuota presign per pengguna per jam            |
| `UPLOAD_QUOTA_PER_DAY`                         | tidak       | `60`                    | Kuota presign per pengguna per hari           |
| `UPLOAD_QUOTA_ADMIN_PER_HOUR`                  | tidak       | `100`                   | Kuota presign admin per jam (bebas harian)    |

### Web (`apps/web/.env.local`)

| Variabel                        | Wajib       | Default                 | Keterangan                                    |
| ------------------------------- | ----------- | ----------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | ya          | `http://localhost:3001` | Base URL API                                  |
| `NEXT_PUBLIC_SITE_URL`          | ya          | `http://localhost:3000` | URL publik untuk metadata, canonical, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL`      | ya (Fase 2) | —                       | URL Supabase                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya (Fase 2) | —                       | Anon key (aman di browser)                    |
| `REVALIDATE_SECRET`             | opsional    | —                       | Secret route revalidasi (sama dengan API)     |

## Batas Laju & Kuota Unggahan (Fase 10)

- Batas laju memakai `@nestjs/throttler`; endpoint terautentikasi dihitung per **id pengguna**
  (bukan IP bersama server Next.js/Vercel), endpoint publik per IP.
- Default: publik 600/menit per IP, pencarian publik 600/menit per IP (penghitung sendiri),
  presign 10/menit per pengguna, `GET /api/me` 60/menit per pengguna, health dikecualikan.
- Kuota presign: 20/jam dan 60/hari per pengguna, disimpan di tabel `upload_requests`
  (`user_id`, `created_at`) sehingga tahan restart Render. Admin bebas kuota harian dengan batas
  jam 100 (dapat diatur lewat env).
- Semua angka dibaca dari env (`THROTTLE_*`, `UPLOAD_QUOTA_*`) dengan default di atas.
- Pelanggaran batas laju mengembalikan `429` dengan pesan Indonesia; pelanggaran kuota juga
  `429`.

## Deploy

**Web (Vercel)**

1. Import repo, set **Root Directory** ke `apps/web`.
2. Framework terdeteksi otomatis (Next.js). Build command: `cd ../.. && pnpm --filter web build`
   agar Prisma/Turbo tetap melihat workspace.
3. Isi env `NEXT_PUBLIC_API_URL` (URL Render), `NEXT_PUBLIC_SITE_URL` (domain produksi),
   `NEXT_PUBLIC_SUPABASE_URL`, dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**API (Render)**

Blueprint tersedia di `render.yaml` di akar repo. Render membaca konfigurasi ini saat
membuat Web Service (Root Directory tetap `apps/api`):

1. Build: `pnpm install --frozen-lockfile && pnpm --filter @webdakwah/shared build && pnpm --filter api build`.
2. Start: `pnpm --filter api db:migrate && node apps/api/dist/main.js` (migrasi jalan otomatis
   saat start; butuh `DIRECT_URL`).
3. Health check path: `/health`.
4. Isi env yang ditandai `sync: false` di `render.yaml` (`DATABASE_URL`, `DIRECT_URL`,
   `SUPABASE_URL`, `FRONTEND_ORIGINS`, `R2_*`, dsb). Nilai batas laju/kuota punya default.
   Set `FRONTEND_ORIGINS` ke domain Vercel dan lengkapi `R2_*` (termasuk CORS bucket ke
   domain web).

## Visual Hero

Hero beranda adalah Server Component dua kolom pada desktop: teks dan pencarian di
kiri, panel visual di kanan. Di layar kecil urutannya teks, pencarian, lalu panel.

- Konfigurasi statis di `apps/web/src/lib/hero.ts`; tidak ada pembacaan folder,
  `process.cwd()`, atau pengecekan `window`.
- `HERO_IMAGE` (`null` secara default) menampilkan foto 4/5 dengan `next/image`,
  `priority`, `sizes="(min-width: 1024px) 45vw, 100vw"`, dan gradien hanya di area
  gambar. Bila `HERO_AYAT` juga diisi, kartu ayat tampil di tepi bawah foto.
- `HERO_AYAT` (`null` secara default) hanya tampil setelah semua kolom terisi,
  termasuk `verifiedBy` dan `verifiedAt`. Tidak ada teks ayat di kode sumber.
- Tanpa foto, panel berpola menampilkan konten terbaru; bila belum ada konten,
  tampil pesan ringkas.
- Spesifikasi foto, cara mengisi konstanta, dan arahan artistik ada di
  [`docs/hero-image.md`](docs/hero-image.md).
- Tes `apps/web/src/lib/hero.test.ts` menjaga agar ayat tidak tampil tanpa
  pemeriksa dan tanggal pemeriksaan.

## Release Preparation (Fase 24)

### Uji asap

Jalankan uji asap penerbitan:

```bash
pnpm smoke
```

Secara default membaca `API_URL` dan `WEB_URL` dari lingkungan. Opsional:

```bash
pnpm smoke --api=http://localhost:3001 --web=http://localhost:3000
```

Uji mencakup `/health`, daftar konten publik, kategori/tag/penceramah publik, `/api/public/live`,
sitemap.xml, robots.txt, dan verifikasi bahwa endpoint admin menolak permintaan tanpa token (401/403).

### Deployment referensi

**Supabase**

- Matikan sign-up publik (`Auth → Settings → Enable email signos`). Seed admin melalui `db:seed`
  dengan `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` di `.env`.
- Terapkan migrasi dari database kosong: `pnpm --filter api db:migrate` (butuh `DATABASE_URL` dan
  `DIRECT_URL`). Gunakan URL koneksi langsung, bukan pooler, untuk migrasi Prisma.
- Verifikasi seeding berjalan bersih (`pnpm --filter api db:seed` → admin tercipta, konten kosong).

**R2 (Cloudflare)**

- Isi `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`.
- Bucket perlu CORS `PUT` dari origin web dengan header `Content-Type`. `R2_PUBLIC_BASE_URL` menjadi
  domain baca publik (isi `r2.dev` untuk akses publik tanpa domain kustom).
- Setelah R2 siap, `registerVideoAllowedHost(new URL(R2_PUBLIC_BASE_URL).hostname)` berlaku di
  `StorageService`, sehingga isi media dari bucket ini tetap disetujui saat disaring sebagai VIDEO.

**Render**

- Root directory tetap `apps/api`. Blueprint `render.yaml` di root.
- Build: `pnpm install --frozen-lockfile && pnpm --filter @webdakwah/shared build && pnpm --filter api build`.
- Start: `pnpm --filter api db:migrate && node apps/api/dist/main.js` (migrasi otomatis; butuh `DIRECT_URL`).
- Health check path: `/health`.
- Isi env non-sinkron (di `render.yaml`) `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
  `FRONTEND_ORIGINS`, `R2_*`, `REVALIDATE_SECRET`, `THROTTLE_*`, `UPLOAD_QUOTA_*`.

**Vercel**

- Root directory: `apps/web` (Next.js 16). Build: `pnpm --filter web build`.
- API **tidak diimpor** ke Vercel. Web menghubungi API melalui `NEXT_PUBLIC_API_URL` (URL Render).
- Isi `NEXT_PUBLIC_SITE_URL` (domain produksi), `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET` (sama dengan API).
- Webhook revalidasi: `POST /api/revalidate` dengan `x-revalidate-secret`; dua sisi (API + web)
  mengisi `FRONTEND_REVALIDATE_URL` ke `https://<vercel-domain>/api/revalidate`.

### Masalah umum

- **CORS R2**: bucket harus mengizinkan `PUT` dari origin web (`https://<domain>`) dengan
  `Content-Type`. Cek `Access-Control-Allow-Origin` di response presign/PUT.
- **Mixed content stream `http`**: alamat siaran `http` dipaksa `EXTERNAL` (browser memblokir
  audio http di halaman https). Ganti ke `https` atau `EMBED`.
- **Render tertidur**: Render sleep (free tier) merender halaman jeda 30–60 detik saat pertama kali
  akses. Gunakan plan aktif atau cooldown.
- **Proyek Supabase dijeda**: supabase proyek gratis yang dijalankan lama kadang sleep.
  Manually wake melalui `https://<project>.supabase.co/project-services` atau gunakan instance
  aktif. `DATABASE_URL` tetap aktif, tetapi kolam koneksi kosong mengakibatkan timeout.
