
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

  UPDATE public.license_keys
  SET bound_ip = NULL
  WHERE id = _key_id;

  RETURN FOUND;
END;
$$;
