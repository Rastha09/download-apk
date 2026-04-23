DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'apk_category' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.apk_category AS ENUM ('free', 'donation');
  END IF;
END $$;

ALTER TABLE public.apk_uploads
ADD COLUMN IF NOT EXISTS category public.apk_category NOT NULL DEFAULT 'free';

ALTER TABLE public.apk_uploads
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_apk_uploads_updated_at ON public.apk_uploads;
CREATE TRIGGER set_apk_uploads_updated_at
BEFORE UPDATE ON public.apk_uploads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_string TEXT NOT NULL UNIQUE,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bound_ip INET,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view license keys" ON public.license_keys;
CREATE POLICY "Admins can view license keys"
ON public.license_keys
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can create license keys" ON public.license_keys;
CREATE POLICY "Admins can create license keys"
ON public.license_keys
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update license keys" ON public.license_keys;
CREATE POLICY "Admins can update license keys"
ON public.license_keys
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete license keys" ON public.license_keys;
CREATE POLICY "Admins can delete license keys"
ON public.license_keys
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_license_keys_key_string ON public.license_keys (key_string);
CREATE INDEX IF NOT EXISTS idx_license_keys_expiry_date ON public.license_keys (expiry_date);
CREATE INDEX IF NOT EXISTS idx_license_keys_is_active ON public.license_keys (is_active);

CREATE OR REPLACE FUNCTION public.validate_license_key(_key text, _client_ip text)
RETURNS TABLE(is_valid boolean, message text, expiry_date date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_key text := upper(trim(_key));
  current_key public.license_keys%ROWTYPE;
  parsed_ip inet;
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

  SELECT *
  INTO current_key
  FROM public.license_keys
  WHERE key_string = normalized_key;

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

  IF current_key.bound_ip IS NULL THEN
    UPDATE public.license_keys
    SET bound_ip = parsed_ip
    WHERE id = current_key.id AND bound_ip IS NULL;

    SELECT *
    INTO current_key
    FROM public.license_keys
    WHERE id = current_key.id;
  END IF;

  IF current_key.bound_ip IS DISTINCT FROM parsed_ip THEN
    RETURN QUERY SELECT false, 'Key ini sudah digunakan di perangkat lain', current_key.expiry_date;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'License key valid', current_key.expiry_date;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_license_key(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_license_key(text, text) TO anon, authenticated;