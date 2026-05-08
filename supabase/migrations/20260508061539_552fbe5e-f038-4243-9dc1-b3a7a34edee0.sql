-- Tambah kolom bound_devices untuk binding berbasis perangkat
ALTER TABLE public.license_keys
  ADD COLUMN IF NOT EXISTS bound_devices text[] NOT NULL DEFAULT '{}';

-- Drop fungsi lama yang berbasis IP
DROP FUNCTION IF EXISTS public.validate_license_key(text, text);
DROP FUNCTION IF EXISTS public.reset_license_ip(uuid);

-- Fungsi validasi berbasis device
CREATE OR REPLACE FUNCTION public.validate_license_key(_key text, _device_id text)
RETURNS TABLE(is_valid boolean, message text, expiry_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_key text := upper(trim(_key));
  normalized_device text := trim(_device_id);
  current_key public.license_keys%ROWTYPE;
  max_devices constant int := 3;
BEGIN
  IF normalized_key IS NULL OR normalized_key = '' THEN
    RETURN QUERY SELECT false, 'License key wajib diisi', NULL::date;
    RETURN;
  END IF;

  IF normalized_device IS NULL OR normalized_device = '' OR length(normalized_device) < 8 OR length(normalized_device) > 128 THEN
    RETURN QUERY SELECT false, 'Device ID tidak valid', NULL::date;
    RETURN;
  END IF;

  SELECT * INTO current_key FROM public.license_keys WHERE key_string = normalized_key;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'License key tidak valid', NULL::date;
    RETURN;
  END IF;

  IF NOT current_key.is_active THEN
    RETURN QUERY SELECT false, 'License key sudah tidak aktif', current_key.expiry_date;
    RETURN;
  END IF;

  IF current_key.expiry_date < CURRENT_DATE THEN
    RETURN QUERY SELECT false, 'License key sudah expired', current_key.expiry_date;
    RETURN;
  END IF;

  -- Device sudah terdaftar
  IF normalized_device = ANY(current_key.bound_devices) THEN
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  -- Slot masih ada
  IF COALESCE(array_length(current_key.bound_devices, 1), 0) < max_devices THEN
    UPDATE public.license_keys
    SET bound_devices = array_append(bound_devices, normalized_device)
    WHERE id = current_key.id;
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'Key ini sudah dipakai di terlalu banyak perangkat', current_key.expiry_date;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text) FROM anon, authenticated;

-- Fungsi reset device binding (super admin only)
CREATE OR REPLACE FUNCTION public.reset_license_devices(_key_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can reset device binding';
  END IF;

  UPDATE public.license_keys
  SET bound_devices = '{}', bound_ips = '{}'
  WHERE id = _key_id;
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_license_devices(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_license_devices(uuid) TO authenticated;