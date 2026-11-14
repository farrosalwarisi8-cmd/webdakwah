-- Migrasi awal Fase 2: profil pengguna + role.
-- SQL tabel dihasilkan dari schema.prisma (prisma migrate diff), lalu ditambah
-- trigger Supabase Auth dan RLS di bagian bawah.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTRIBUTOR');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "full_name" VARCHAR(120),
    "role" "Role" NOT NULL DEFAULT 'CONTRIBUTOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- Profil dibuat otomatis setiap ada pengguna baru di Supabase Auth.
-- Role selalu CONTRIBUTOR; hanya admin yang bisa menaikkannya lewat seed/backoffice.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
        'CONTRIBUTOR',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger dan RLS hanya berlaku di Supabase (butuh skema auth); pada Postgres
-- biasa bagian ini dilewati agar migrasi tetap portabel untuk pengembangan lokal.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- Pengguna hanya boleh membaca profilnya sendiri lewat PostgREST.
        -- API memakai koneksi server (postgres) sehingga tidak terpengaruh RLS.
        CREATE POLICY "profiles_select_own" ON public.profiles
            FOR SELECT TO authenticated
            USING (auth.uid() = id);
    END IF;
END;
$$;
