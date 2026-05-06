
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.reset_license_ip(uuid) FROM public;
