CREATE OR REPLACE FUNCTION public.validate_license_key(_key text, _device_id text)
 RETURNS TABLE(is_valid boolean, message text, expiry_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_key text := upper(trim(_key));
  normalized_device text := trim(_device_id);
  current_key public.license_keys%ROWTYPE;
  max_devices constant int := 1;
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

  IF normalized_device = ANY(current_key.bound_devices) THEN
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  IF COALESCE(array_length(current_key.bound_devices, 1), 0) < max_devices THEN
    UPDATE public.license_keys
    SET bound_devices = array_append(bound_devices, normalized_device)
    WHERE id = current_key.id;
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'Key ini sudah dipakai di perangkat lain', current_key.expiry_date;
END;
$function$;

-- Reset semua binding device yang sudah ada agar pengguna bisa mendaftar ulang dengan limit baru
UPDATE public.license_keys SET bound_devices = '{}', bound_ips = '{}';