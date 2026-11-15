-- Migrasi Fase 11: kategori, tag, dan penceramah untuk konten.

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

CREATE TABLE "speakers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "bio" VARCHAR(500),
    "avatar_url" VARCHAR(2048),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "speakers_slug_key" ON "speakers"("slug");

CREATE TABLE "content_categories" (
    "content_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "content_categories_pkey" PRIMARY KEY ("content_id", "category_id")
);

CREATE INDEX "content_categories_category_id_idx" ON "content_categories"("category_id");

CREATE TABLE "content_tags" (
    "content_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("content_id", "tag_id")
);

CREATE INDEX "content_tags_tag_id_idx" ON "content_tags"("tag_id");

-- AlterTable
ALTER TABLE "contents" ADD COLUMN "speaker_id" UUID;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "contents_speaker_id_idx" ON "contents"("speaker_id");

-- RLS hanya berlaku di Supabase; pada Postgres biasa bagian ini dilewati.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;
