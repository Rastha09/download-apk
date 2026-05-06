
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS bound_ips inet[] NOT NULL DEFAULT '{}';

UPDATE public.license_keys
SET bound_ips = ARRAY[bound_ip]
WHERE bound_ip IS NOT NULL AND (bound_ips IS NULL OR array_length(bound_ips, 1) IS NULL);

ALTER TABLE public.license_keys DROP COLUMN IF EXISTS bound_ip;

CREATE OR REPLACE FUNCTION public.validate_license_key(_key text, _client_ip text)
RETURNS TABLE(is_valid boolean, message text, expiry_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  normalized_key text := upper(trim(_key));
  current_key public.license_keys%ROWTYPE;
  parsed_ip inet;
  max_ips constant int := 3;
BEGIN
  IF normalized_key IS NULL OR normalized_key = '' THEN
    RETURN QUERY SELECT false, 'License key wajib diisi', NULL::date;
    RETURN;
  END IF;

  IF _client_ip IS NULL OR btrim(_client_ip) = '' OR _client_ip = 'unknown' THEN
    RETURN QUERY SELECT false, 'IP address tidak valid', NULL::date;
    RETURN;
  END IF;

  BEGIN
    parsed_ip := _client_ip::inet;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'IP address tidak valid', NULL::date;
    RETURN;
  END;

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

  -- IP sudah terdaftar
  IF parsed_ip = ANY(current_key.bound_ips) THEN
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  -- Slot masih ada, tambahkan IP baru
  IF COALESCE(array_length(current_key.bound_ips, 1), 0) < max_ips THEN
    UPDATE public.license_keys
    SET bound_ips = array_append(bound_ips, parsed_ip)
    WHERE id = current_key.id;
    RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
    RETURN;
  END IF;

  -- Sudah penuh
  RETURN QUERY SELECT false, 'Key ini sudah dipakai di terlalu banyak perangkat/jaringan', current_key.expiry_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_license_ip(_key_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can reset IP binding';
  END IF;

  UPDATE public.license_keys SET bound_ips = '{}' WHERE id = _key_id;
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_license_ip(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text) FROM public, anon;
