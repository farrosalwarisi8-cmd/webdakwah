-- Migrasi Fase 12: tautan terkait (ContentLink) untuk konten.

-- CreateTable
CREATE TABLE "content_links" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_links_content_id_order_idx" ON "content_links"("content_id", "order");

-- AddForeignKey
ALTER TABLE "content_links" ADD CONSTRAINT "content_links_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS hanya berlaku di Supabase; pada Postgres biasa bagian ini dilewati.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.content_links ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;
