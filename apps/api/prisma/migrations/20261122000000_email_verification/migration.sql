-- Fase 32: pendaftaran mandiri + penanda verifikasi email.
--
-- Profil tetap dibuat trigger segera setelah signUp (role CONTRIBUTOR), tetapi
-- email_verified_at hanya terisi ketika Supabase menandai email terkonfirmasi.
-- Dashboard memakai kolom ini untuk membedakan akun yang sudah/belum
-- memverifikasi email; login sendiri tetap ditolak Supabase sebelum konfirmasi.

ALTER TABLE "profiles" ADD COLUMN "email_verified_at" TIMESTAMPTZ(3);

-- Akun yang dibuat admin/seed lewat admin API bisa langsung punya
-- email_confirmed_at, jadi nilai awal diambil dari sana.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        email_verified_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
        'CONTRIBUTOR',
        true,
        NEW.email_confirmed_at,
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Dipanggil saat pengguna mengeklik tautan verifikasi di email.
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.profiles
        SET email_verified_at = NEW.email_confirmed_at,
            updated_at = now()
        WHERE id = NEW.id
          AND (email_verified_at IS NULL OR email_verified_at <> NEW.email_confirmed_at);
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger dan backfill hanya berlaku di Supabase (butuh skema auth).
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        CREATE TRIGGER on_auth_user_email_confirmed
            AFTER UPDATE OF email_confirmed_at ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

        -- Akun yang sudah terverifikasi sebelum kolom ini ditambahkan.
        UPDATE public.profiles p
        SET email_verified_at = u.email_confirmed_at
        FROM auth.users u
        WHERE u.id = p.id
          AND u.email_confirmed_at IS NOT NULL
          AND p.email_verified_at IS NULL;
    END IF;
END;
$$;
