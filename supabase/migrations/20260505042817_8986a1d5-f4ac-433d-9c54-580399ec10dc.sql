
-- 1. Restrict donation APKs at the RLS level
DROP POLICY IF EXISTS "Anyone can view APK uploads" ON public.apk_uploads;

CREATE POLICY "Anyone can view free APK uploads"
  ON public.apk_uploads
  FOR SELECT
  USING (category = 'free'::apk_category);

CREATE POLICY "Admins can view all APK uploads"
  ON public.apk_uploads
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. apk_redirects: scope writes to authenticated, add UPDATE policy
DROP POLICY IF EXISTS "Only admins can insert redirects" ON public.apk_redirects;
DROP POLICY IF EXISTS "Only admins can delete redirects" ON public.apk_redirects;

CREATE POLICY "Only admins can insert redirects"
  ON public.apk_redirects
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete redirects"
  ON public.apk_redirects
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update redirects"
  ON public.apk_redirects
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Revoke EXECUTE on sensitive SECURITY DEFINER functions from public roles
-- (Edge functions use service_role which bypasses these grants)
REVOKE EXECUTE ON FUNCTION public.validate_license_key(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM anon, authenticated, public;
