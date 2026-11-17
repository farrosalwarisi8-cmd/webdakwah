-- Migrasi Fase 19: siaran langsung radio mitra dan jadwal siaran.
-- Server radio tidak dibuat di proyek ini; tabel hanya menyimpan alamat dengar
-- publik dan jadwal yang diatur admin.

-- CreateEnum
CREATE TYPE "PlayMode" AS ENUM ('EMBED', 'EXTERNAL');

-- CreateTable
CREATE TABLE "live_stream" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL DEFAULT 'Siaran Langsung',
    "description" VARCHAR(500),
    "stream_url" VARCHAR(2048),
    "play_mode" "PlayMode" NOT NULL DEFAULT 'EXTERNAL',
    "status_url" VARCHAR(2048),
    "telegram_url" VARCHAR(2048),
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "live_stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_schedules" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "speaker_id" UUID,
    "day_of_week" SMALLINT,
    "date" DATE,
    "start_time" VARCHAR(5) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "notes" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "broadcast_schedules_pkey" PRIMARY KEY ("id")
);

-- Jadwal mingguan (day_of_week) ATAU acara khusus (date), tidak boleh keduanya.
ALTER TABLE "broadcast_schedules"
    ADD CONSTRAINT "broadcast_schedules_scope_check"
    CHECK (("day_of_week" IS NOT NULL) <> ("date" IS NOT NULL));

ALTER TABLE "broadcast_schedules"
    ADD CONSTRAINT "broadcast_schedules_day_range_check"
    CHECK ("day_of_week" IS NULL OR ("day_of_week" >= 0 AND "day_of_week" <= 6));

CREATE INDEX "broadcast_schedules_day_of_week_start_time_idx"
    ON "broadcast_schedules"("day_of_week", "start_time");
CREATE INDEX "broadcast_schedules_date_idx" ON "broadcast_schedules"("date");

-- AddForeignKey
ALTER TABLE "broadcast_schedules"
    ADD CONSTRAINT "broadcast_schedules_speaker_id_fkey"
    FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS hanya berlaku di Supabase; pada Postgres biasa bagian ini dilewati.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.live_stream ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.broadcast_schedules ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;
