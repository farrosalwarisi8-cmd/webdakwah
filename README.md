# WebDakwah

Website dakwah berbahasa Indonesia: artikel, audio kajian, video pendek, dan tautan rujukan.
Konten ditulis oleh **Kontributor**, lalu ditinjau dan diterbitkan oleh **Admin**.

> Status: **Fase 6 — Arsip & Kelola Terbitan**. Siklus konten kini lengkap: tulis, ajukan,
> moderasi, terbit, arsip, dan pulihkan. Unggah media ke R2 dan fitur lanjutan menyusul.

## Teknologi

| Bagian          | Teknologi                                                      |
| --------------- | -------------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                                    |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend         | NestJS 12 + Fastify                                            |
| Database & Auth | Supabase (Postgres + Auth), Prisma 7                           |
| Media           | Cloudflare R2 dengan presigned URL (fase media, belum aktif)   |
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
- Media masih berupa tautan http/https. Unggah berkas ke R2 menyusul di fase media.

Endpoint API (semua butuh Bearer token):

| Metode & path                      | Keterangan                                   |
| ---------------------------------- | -------------------------------------------- |
| `GET /api/contents/mine`           | Daftar konten sendiri (`?status=`, `?page=`) |
| `GET /api/contents/:id`            | Detail untuk pemilik atau admin              |
| `POST /api/contents`               | Buat draft baru                              |
| `PATCH /api/contents/:id`          | Sunting draft/konten ditolak                 |
| `POST /api/contents/:id/submit`    | Ajukan review (validasi kelengkapan)         |
| `POST /api/contents/:id/withdraw`  | Tarik kembali ke draft                       |
| `DELETE /api/contents/:id`         | Hapus draft/konten ditolak                   |
| `GET /api/contents/review`         | Antrean `PENDING_REVIEW` (admin saja)        |
| `POST /api/contents/:id/publish`   | Terbitkan konten (admin saja)                |
| `POST /api/contents/:id/reject`    | Tolak + catatan wajib (admin saja)           |
| `GET /api/contents/managed`        | Daftar terbit/arsip (admin saja)             |
| `POST /api/contents/:id/archive`   | Arsipkan konten terbit (admin saja)          |
| `POST /api/contents/:id/unarchive` | Pulihkan konten arsip (admin saja)           |

Endpoint publik di bawah ini **tidak butuh login** dan hanya mengembalikan konten `PUBLISHED`.
Responsnya memakai skema terpisah (`publicContentSummarySchema`/`publicContentDetailSchema`) yang
tidak memuat email penulis, catatan review, atau status internal.

| Metode & path                          | Keterangan                                         |
| -------------------------------------- | -------------------------------------------------- |
| `GET /api/public/contents?type=&page=` | Daftar konten terbit (filter jenis opsional)       |
| `GET /api/public/contents/:slug`       | Detail konten terbit berdasarkan slug; lainnya 404 |
| `GET /api/public/highlights`           | Satu terbitan terbaru per jenis untuk beranda      |

## Halaman Publik

- `/artikel`, `/audio`, `/video`, `/rujukan` — daftar konten terbit per jenis, 12 per halaman.
- `/artikel/[slug]`, `/audio/[slug]`, `/video/[slug]`, `/rujukan/[slug]` — halaman baca dengan
  metadata judul, deskripsi, canonical, dan OpenGraph. URL memakai slug, bukan UUID.
- Beranda menampilkan satu terbitan terbaru per jenis; bila belum ada, tampil ajakan menunggu.
- Konten berstatus `ARCHIVED` otomatis tidak muncul di daftar, detail, sitemap, maupun highlight.
- `/sitemap.xml` dan `/robots.txt` dihasilkan otomatis. Dashboard, akun, dan halaman masuk
  dikecualikan dari indeks mesin pencari.
- Data diambil dengan revalidasi 60 detik. Bila API sedang mati, halaman tetap tampil dengan
  pesan ramah, bukan error 500.

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
Halaman publik: <http://localhost:3000/artikel>, `/audio`, `/video`, `/rujukan`

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
| `R2_*`                                         | belum aktif | —                       | Kredensial Cloudflare R2 untuk upload media   |
| `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET` | Fase 7      | —                       | Pemicu revalidasi cache web                   |

### Web (`apps/web/.env.local`)

| Variabel                        | Wajib       | Default                 | Keterangan                                    |
| ------------------------------- | ----------- | ----------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | ya          | `http://localhost:3001` | Base URL API                                  |
| `NEXT_PUBLIC_SITE_URL`          | ya          | `http://localhost:3000` | URL publik untuk metadata, canonical, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL`      | ya (Fase 2) | —                       | URL Supabase                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya (Fase 2) | —                       | Anon key (aman di browser)                    |
| `REVALIDATE_SECRET`             | Fase 7      | —                       | Secret untuk route revalidasi                 |

## Deploy

**Web (Vercel)**

1. Import repo, set **Root Directory** ke `apps/web`.
2. Framework terdeteksi otomatis (Next.js). Build command: `cd ../.. && pnpm --filter web build`
   agar Prisma/Turbo tetap melihat workspace.
3. Isi env `NEXT_PUBLIC_API_URL` (URL Render), `NEXT_PUBLIC_SITE_URL` (domain produksi),
   `NEXT_PUBLIC_SUPABASE_URL`, dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**API (Render)**

1. Buat **Web Service** dari repo, Root Directory `apps/api`.
2. Build: `pnpm install && pnpm --filter @webdakwah/shared build && pnpm --filter api build`
   Start: `node apps/api/dist/main.js` (atau `npm --prefix apps/api start`).
3. Pre-deploy (sekali saat rilis skema): `pnpm --filter api db:migrate` — butuh `DIRECT_URL`.
4. Health check path: `/health`.
5. Isi env sesuai tabel di atas (`NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`,
   `SUPABASE_URL`), dan set `FRONTEND_ORIGINS` ke domain Vercel.

## Aturan Kontribusi

- TypeScript strict; hindari `any`. Gunakan tipe dari `@webdakwah/shared`.
- UI berbahasa Indonesia, mobile-first, dan ringan (hindari JS klien yang tidak perlu).
- Jangan menaruh kunci/rahasia di repo — hanya `.env.example`.
- Sebelum commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
