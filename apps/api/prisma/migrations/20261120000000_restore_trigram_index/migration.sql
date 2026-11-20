-- Migration perbaikan: index trigram sempat terhapus oleh migration
-- 20261119035822_add_broadcast_watching yang keliru memuat DROP INDEX.
-- Migration ini membuatnya kembali secara idempoten, tanpa menyentuh data.
-- Pada database baru, index sudah dibuat oleh 20261118000000_trigram_search
-- sehingga blok DO di bawah tidak melakukan apa pun.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'contents'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_contents_trgm'
    ) THEN
        CREATE INDEX idx_contents_trgm
        ON public.contents
        USING GIN (
            (title) gin_trgm_ops,
            (excerpt) gin_trgm_ops,
            (body) gin_trgm_ops
        );
    END IF;
END
$$;
