# WebDakwah

Website dakwah berbahasa Indonesia: artikel, audio kajian, video pendek, dan tautan rujukan.
Konten ditulis oleh **Kontributor**, lalu ditinjau dan diterbitkan oleh **Admin**.

> Status: **Fase 1 — Fondasi**. Yang ada saat ini adalah kerangka monorepo, halaman beranda
> statis, dan endpoint health check. Fitur konten, auth, dan moderasi menyusul di fase berikutnya.

## Teknologi

| Bagian          | Teknologi                                                      |
| --------------- | -------------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                                    |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend         | NestJS 12 + Fastify                                            |
| Database & Auth | Supabase (Postgres + Auth), Prisma (mulai Fase 2)              |
| Media           | Cloudflare R2 dengan presigned URL (mulai Fase 4)              |
| Deploy          | Web → Vercel, API → Render                                     |

## Struktur Folder

```
webdakwah/
├─ apps/
│  ├─ web/        # Next.js App Router (UI publik + dashboard nanti)
│  └─ api/        # NestJS + Fastify
├─ packages/
│  └─ shared/     # Tipe, konstanta (role/status), skema Zod
├─ eslint.config.mjs
├─ turbo.json
└─ tsconfig.base.json
```

`packages/shared` adalah satu-satunya sumber kebenaran untuk aturan yang dipakai kedua app
(daftar role, status konten, tipe konten, validasi URL, pagination).

## Menjalankan Secara Lokal

Prasyarat: Node.js 24 (lihat `.nvmrc`) dan pnpm 12.

```bash
# 1. Install dependensi
pnpm install

# 2. Siapkan environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Jalankan keduanya (web :3000, api :3001)
pnpm dev
```

Jalankan salah satu saja bila perlu:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

Cek API: <http://localhost:3001/health> → `{"status":"ok", ...}`
Endpoint bisnis berada di prefiks `/api`, mis. `http://localhost:3001/api/...`.

## Perintah Penting

```bash
pnpm build         # build semua package (turbo, urut dependensi)
pnpm typecheck     # TypeScript tanpa emit untuk semua package
pnpm lint          # ESLint untuk seluruh repo
pnpm format        # Prettier --write
pnpm format:check  # cek format
```

## Environment Variables

Salin dari file `.env.example` di masing-masing app. Tidak ada nilai rahasia yang disimpan di repo.

### API (`apps/api/.env`)

| Variabel                                          | Wajib  | Default                 | Keterangan                                    |
| ------------------------------------------------- | ------ | ----------------------- | --------------------------------------------- |
| `NODE_ENV`                                        | tidak  | `development`           | `development` \| `test` \| `production`       |
| `PORT`                                            | tidak  | `3001`                  | Port HTTP                                     |
| `HOST`                                            | tidak  | `0.0.0.0`               | Bind address (Render butuh `0.0.0.0`)         |
| `LOG_LEVEL`                                       | tidak  | `info`                  | Level logger Fastify/Pino                     |
| `FRONTEND_ORIGINS`                                | tidak  | `http://localhost:3000` | Origin CORS, dipisah koma                     |
| `DATABASE_URL`                                    | Fase 2 | —                       | URL Postgres via pooler                       |
| `DIRECT_URL`                                      | Fase 2 | —                       | URL langsung untuk migrasi Prisma             |
| `SUPABASE_URL`                                    | Fase 2 | —                       | Base URL project Supabase                     |
| `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Fase 2 | —                       | Kunci Supabase (service role hanya di server) |
| `SUPABASE_JWT_SECRET` / `SUPABASE_JWKS_URL`       | Fase 2 | —                       | Verifikasi token akses                        |
| `R2_*`                                            | Fase 4 | —                       | Kredensial Cloudflare R2 untuk upload media   |
| `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET`    | Fase 7 | —                       | Pemicu revalidasi cache web                   |

### Web (`apps/web/.env.local`)

| Variabel                        | Wajib  | Default                 | Keterangan                    |
| ------------------------------- | ------ | ----------------------- | ----------------------------- |
| `NEXT_PUBLIC_API_URL`           | ya     | `http://localhost:3001` | Base URL API                  |
| `NEXT_PUBLIC_SITE_URL`          | ya     | `http://localhost:3000` | URL publik untuk metadata/OG  |
| `NEXT_PUBLIC_SUPABASE_URL`      | Fase 2 | —                       | URL Supabase                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fase 2 | —                       | Anon key (aman di browser)    |
| `REVALIDATE_SECRET`             | Fase 7 | —                       | Secret untuk route revalidasi |

## Deploy

**Web (Vercel)**

1. Import repo, set **Root Directory** ke `apps/web`.
2. Framework terdeteksi otomatis (Next.js). Build command: `pnpm build` (dijalankan dari root
   karena Turbo perlu melihat workspace), atau gunakan `cd ../.. && pnpm --filter web build`.
3. Isi env `NEXT_PUBLIC_API_URL` (URL Render) dan `NEXT_PUBLIC_SITE_URL` (domain produksi).

**API (Render)**

1. Buat **Web Service** dari repo, Root Directory `apps/api`.
2. Build: `pnpm install && pnpm --filter @webdakwah/shared build && pnpm --filter api build`
   Start: `node apps/api/dist/main.js` (atau `npm --prefix apps/api start`).
3. Health check path: `/health`.
4. Isi env sesuai tabel di atas; set `FRONTEND_ORIGINS` ke domain Vercel.

## Aturan Kontribusi

- TypeScript strict; hindari `any`. Gunakan tipe dari `@webdakwah/shared`.
- UI berbahasa Indonesia, mobile-first, dan ringan (hindari JS klien yang tidak perlu).
- Jangan menaruh kunci/rahasia di repo — hanya `.env.example`.
- Sebelum commit: `pnpm lint && pnpm typecheck && pnpm build`.
