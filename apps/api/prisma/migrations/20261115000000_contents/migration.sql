-- Migrasi Fase 3: konten artikel/audio/video dengan alur draf.
-- SQL tabel dihasilkan dari schema.prisma (prisma migrate diff), lalu ditambah
-- RLS agar penulis hanya bisa membaca barisnya sendiri lewat PostgREST.

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'AUDIO', 'VIDEO', 'LINK');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "contents" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "excerpt" VARCHAR(300),
    "body" TEXT,
    "media_url" VARCHAR(2048),
    "review_note" VARCHAR(500),
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contents_slug_key" ON "contents"("slug");

-- CreateIndex
CREATE INDEX "contents_author_id_updated_at_idx" ON "contents"("author_id", "updated_at");

-- CreateIndex
CREATE INDEX "contents_status_published_at_idx" ON "contents"("status", "published_at");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS hanya berlaku di Supabase (butuh skema auth); pada Postgres biasa
-- bagian ini dilewati agar migrasi tetap portabel untuk pengembangan lokal.
-- API memakai koneksi server (postgres) sehingga tidak terpengaruh RLS.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

        -- Penulis boleh membaca kontennya sendiri; konten terbit bisa dibaca publik
        -- lewat kebijakan terpisah pada fase halaman publik.
        CREATE POLICY "contents_select_own" ON public.contents
            FOR SELECT TO authenticated
            USING (auth.uid() = author_id);
    END IF;
END
$$;
