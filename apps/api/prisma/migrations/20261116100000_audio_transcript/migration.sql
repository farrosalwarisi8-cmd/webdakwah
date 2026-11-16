-- Migrasi Fase 18: transkrip audio (teks polos).

ALTER TABLE "contents" ADD COLUMN "transcript" TEXT;
