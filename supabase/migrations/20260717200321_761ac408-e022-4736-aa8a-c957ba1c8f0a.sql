DROP POLICY IF EXISTS "Anyone can view free APK uploads" ON public.apk_uploads;
REVOKE SELECT ON public.apk_uploads FROM anon;