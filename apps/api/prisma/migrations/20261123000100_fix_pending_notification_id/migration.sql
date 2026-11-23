-- Perbaikan Fase 35: kolom notifications.id tidak punya default di database
-- (nilai uuid dibuat Prisma di sisi klien), sehingga trigger notifikasi
-- pendaftar harus mengisi id sendiri. Tanpa ini, setiap INSERT profil baru
-- gagal dengan "null value in column id" dan pendaftaran tidak pernah selesai.

CREATE OR REPLACE FUNCTION public.notify_admins_pending_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notifications (id, user_id, type, title, message, href)
    SELECT
        gen_random_uuid(),
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
