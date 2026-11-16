# WebDakwah

Website dakwah berbahasa Indonesia: artikel, audio kajian, video pendek, dan tautan rujukan.
Konten ditulis oleh **Kontributor**, lalu ditinjau dan diterbitkan oleh **Admin**.

> Status: **Fase 14 — Manajemen pengguna**. Admin dapat membuat, menonaktifkan, mengubah role,
> dan menghapus akun pengguna melalui `/dashboard/pengguna`.

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
  (`content:create`, `content:update-own`, `content:publish`, `content:delete-any`, `users:manage`).
  Kontributor hanya mendapat dua izin pertama.
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
- Audio dan video bisa diunggah dari editor ke Cloudflare R2, atau tetap memakai tautan
  http/https. Batas: audio 50 MB (MP3, M4A, AAC, OGG), video 200 MB (MP4, WebM).

Endpoint API (semua butuh Bearer token):

| Metode & path                      | Keterangan                                     |
| ---------------------------------- | ---------------------------------------------- |
| `GET /api/contents/mine`           | Daftar konten sendiri (`?status=`, `?page=`)   |
| `GET /api/contents/:id`            | Detail untuk pemilik atau admin                |
| `POST /api/contents`               | Buat draft baru                                |
| `PATCH /api/contents/:id`          | Sunting draft/konten ditolak                   |
| `POST /api/contents/:id/submit`    | Ajukan review (validasi kelengkapan)           |
| `POST /api/contents/:id/withdraw`  | Tarik kembali ke draft                         |
| `DELETE /api/contents/:id`         | Hapus draft/konten ditolak                     |
| `GET /api/contents/review`         | Antrean `PENDING_REVIEW` (admin saja)          |
| `POST /api/contents/:id/publish`   | Terbitkan konten (admin saja)                  |
| `POST /api/contents/:id/reject`    | Tolak + catatan wajib (admin saja)             |
| `GET /api/contents/managed`        | Daftar terbit/arsip (admin saja)               |
| `POST /api/contents/:id/archive`   | Arsipkan konten terbit (admin saja)            |
| `POST /api/contents/:id/unarchive` | Pulihkan konten arsip (admin saja)             |
| `POST /api/uploads/presign`        | URL PUT sementara ke R2 (semua pengguna aktif) |

Endpoint publik di bawah ini **tidak butuh login** dan hanya mengembalikan konten `PUBLISHED`.
Responsnya memakai skema terpisah (`publicContentSummarySchema`/`publicContentDetailSchema`) yang
tidak memuat email penulis, catatan review, atau status internal.

| Metode & path                           | Keterangan                                         |
| --------------------------------------- | -------------------------------------------------- |
| `GET /api/public/contents?type=&page=`  | Daftar konten terbit (filter jenis opsional)       |
| `GET /api/public/contents/:slug`        | Detail konten terbit berdasarkan slug; lainnya 404 |
| `GET /api/public/highlights`            | Satu terbitan terbaru per jenis untuk beranda      |
| `GET /api/public/search?q=&type=&page=` | Cari judul/ringkasan/isi konten terbit (q 2–100)   |

## Unggah Media ke R2

- `POST /api/uploads/presign` menerima `{ contentType, size }` dari pengguna yang sudah login,
  lalu mengembalikan `{ uploadUrl, publicUrl, key, expiresIn }`. URL PUT berlaku 10 menit.
- Browser mengunggah berkas **langsung ke R2** lewat `PUT` (dengan progres), jadi berkas tidak
  melewati API dan batas body API tetap kecil. Setelah selesai, kolom tautan media terisi
  otomatis dengan `publicUrl`.
- Server memvalidasi ulang jenis dan ukuran (allowlist MIME + batas per jenis); permintaan yang
  tidak sesuai ditolak `400`. Bila kredensial R2 belum lengkap, endpoint mengembalikan `503`.
- Objek disimpan sebagai `media/<user-id>/<uuid>.<ext>`; `Content-Type` dan `Content-Length`
  ikut ditandatangani sehingga isi tidak bisa mengganti jenis/ukuran. Checksum CRC32 otomatis
  dari AWS SDK dimatikan agar unggahan berkas asli tidak ditolak.
- Bucket perlu **CORS** yang mengizinkan `PUT` dari origin web (mis. `https://domain-anda.com`)
  dengan header `Content-Type`, dan akses baca publik lewat domain kustom atau `r2.dev`.
- Objek R2 dihapus otomatis saat tautan media konten diganti atau dikosongkan, dan saat konten
  dihapus. Objek diarsipkan tidak dihapus. Hanya berkas pada folder `media/<penulis-konten>/`
  milik bucket ini yang disentuh; URL eksternal dibiarkan.
- Untuk uji lokal tanpa akun R2, isi `R2_ENDPOINT` ke server S3-compatible seperti MinIO dan
  set `forcePathStyle` otomatis aktif. Alur presign/PUT/GET sudah diuji dengan endpoint S3
  tiruan; verifikasi terhadap R2 asli menunggu kredensial produksi.

## Halaman Publik

- `/artikel`, `/audio`, `/video`, `/rujukan` — daftar konten terbit per jenis, 12 per halaman.
- `/artikel/[slug]`, `/audio/[slug]`, `/video/[slug]`, `/rujukan/[slug]` — halaman baca dengan
  metadata judul, deskripsi, canonical, dan OpenGraph. URL memakai slug, bukan UUID.
- Beranda menampilkan satu terbitan terbaru per jenis; bila belum ada, tampil ajakan menunggu.
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
| `THROTTLE_GLOBAL_PER_MIN`                      | tidak       | `600`                   | Batas laju publik per IP (permintaan/menit)  |
| `THROTTLE_UPLOAD_PER_MIN`                      | tidak       | `10`                    | Batas laju presign per pengguna              |
| `THROTTLE_SEARCH_PER_MIN`                      | tidak       | `600`                   | Batas laju pencarian publik per IP           |
| `THROTTLE_SESSION_PER_MIN`                     | tidak       | `60`                    | Batas laju `GET /api/me` per pengguna        |
| `UPLOAD_QUOTA_PER_HOUR`                        | tidak       | `20`                    | Kuota presign per pengguna per jam           |
| `UPLOAD_QUOTA_PER_DAY`                         | tidak       | `60`                    | Kuota presign per pengguna per hari          |
| `UPLOAD_QUOTA_ADMIN_PER_HOUR`                  | tidak       | `100`                   | Kuota presign admin per jam (bebas harian)   |

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

## Aturan Kontribusi

- TypeScript strict; hindari `any`. Gunakan tipe dari `@webdakwah/shared`.
- UI berbahasa Indonesia, mobile-first, dan ringan (hindari JS klien yang tidak perlu).
- Jangan menaruh kunci/rahasia di repo — hanya `.env.example`.
- Sebelum commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
