-- Migrasi Fase 26: pencarian trigram (pg_trgm) untuk match near.
--
-- Digunakan di FASE 26: halaman publik search (GET /api/public/search).
-- Query q (2-100 karakter) dengan match yang salah ketik tetap muncul
-- (mis. teks Arab yang ditulis secara tidak standar), tanpa memaksa ikut
-- match di body yang panjang.
--
-- Perhatian: `pg_trgm` adalah extension PostgreSQL; bila database ini
-- bukan Supabase (mis. Postgres lokal tanpa extension), pernyataan ini
-- dilewati oleh driver yang sudah mendukung IF NOT EXISTS.
-- 

-- 1. Aktifkan extension jika belum ada.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Hanya tambah index trigram bila masih belum ada.
--    Prisma client tidak memiliki salah satu index ini secara otomatis,
--    jadi kita buat dengan IF NOT EXISTS supaya migrasi dapat dijalankan
--    berkali-kali tanpa gagal (idempotent).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_contents_trgm'
    ) THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS
            idx_contents_trgm
        ON public.contents
        USING GIN (
            (title) gin_trgm_ops,
            (excerpt) gin_trgm_ops,
            (body) gin_trgm_ops
        );
    END IF;
END
$$;

-- 3. Catatan:akala ini dijalankan di database yang Masih kosong / baru
--    diinisialisasi, index ini dibuat setelah baris `CREATE EXTENSION`.
--    Jika sudah ada data di `contents`, `CONCURRENTLY` memastikan tidak
--    menahan kunci yang lama; gunakan `CREATE INDEX` biasa bila tak tersedia.
