-- Migrasi Fase 10: catatan presign unggahan untuk kuota per pengguna.
-- Disimpan di database (bukan memori proses) agar kuota tetap berlaku saat
-- Render memulai ulang atau menjalankan lebih dari satu instance.

-- CreateTable
CREATE TABLE "upload_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_requests_user_id_created_at_idx" ON "upload_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "upload_requests_created_at_idx" ON "upload_requests"("created_at");

-- AddForeignKey
ALTER TABLE "upload_requests" ADD CONSTRAINT "upload_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabel ini hanya diakses API lewat koneksi server. RLS tetap diaktifkan di
-- Supabase tanpa kebijakan agar tidak bisa dibaca lewat PostgREST; pada
-- Postgres biasa blok ini dilewati supaya migrasi tetap portabel.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.upload_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;
