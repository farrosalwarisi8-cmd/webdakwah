-- Migrasi Fase 21: notifikasi review untuk kontributor dan admin.
-- Baris dibuat oleh API (koneksi server), bukan oleh klien. RLS hanya
-- mengizinkan pengguna membaca dan menandai notifikasinya sendiri.

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTENT_SUBMITTED', 'CONTENT_PUBLISHED', 'CONTENT_REJECTED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" VARCHAR(500),
    "href" VARCHAR(300),
    "content_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx"
    ON "notifications"("user_id", "is_read", "created_at");
CREATE INDEX "notifications_user_id_created_at_idx"
    ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_content_id_idx" ON "notifications"("content_id");

-- AddForeignKey
ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "contents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS hanya berlaku di Supabase; pada Postgres biasa bagian ini dilewati.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "notifications_select_own" ON public.notifications
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "notifications_update_own" ON public.notifications
            FOR UPDATE TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
