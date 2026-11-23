-- Fase 35: persetujuan admin untuk pendaftaran mandiri.
--
-- Akun baru dari signUp publik mulai dari PENDING: boleh login dan melihat
-- dashboard, tetapi API menolak pembuatan/pengajuan konten sampai admin
-- menyetujui. Akun yang dibuat admin/seed langsung APPROVED.
--
-- Semua profil yang sudah ada sebelum kolom ini ditambahkan dianggap sudah
-- tepercaya, jadi di-backfill APPROVED agar tidak ada akun yang terkunci.

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "account_status" "AccountStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: akun lama (admin, seed, kontributor) sudah disetujui.
UPDATE "profiles" SET "account_status" = 'APPROVED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_PENDING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_REJECTED';

-- Profil baru dari pendaftaran mandiri selalu menunggu persetujuan.
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
        account_status,
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
        'PENDING',
        NEW.email_confirmed_at,
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Beri tahu semua admin aktif saat ada pendaftar baru yang menunggu.
CREATE OR REPLACE FUNCTION public.notify_admins_pending_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, href)
    SELECT
        admin.id,
        'ACCOUNT_PENDING',
        'Pendaftar baru menunggu persetujuan',
        'Akun ' || NEW.email || ' menunggu ditinjau sebelum bisa menulis konten.',
        '/dashboard/pengguna'
    FROM public.profiles admin
    WHERE admin.role = 'ADMIN'
      AND admin.is_active = true;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_pending_approval ON public.profiles;
CREATE TRIGGER on_profile_pending_approval
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.account_status = 'PENDING')
    EXECUTE FUNCTION public.notify_admins_pending_profile();
