-- Revoke default PUBLIC execute on all SECURITY DEFINER functions and grant narrowly

-- validate_license_key (two overloads) — only callable via edge function (service_role)
REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_license_key(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_license_key(text, text, text) TO service_role;

-- increment_download_count — called from edge function only after this change
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_download_count(uuid) TO service_role;

-- reset_license_devices — admin-only, via service_role from edge or authenticated super admins
REVOKE EXECUTE ON FUNCTION public.reset_license_devices(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_license_devices(uuid) TO authenticated, service_role;

-- is_super_admin / has_role — used by RLS (runs as definer regardless) and edge functions
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
