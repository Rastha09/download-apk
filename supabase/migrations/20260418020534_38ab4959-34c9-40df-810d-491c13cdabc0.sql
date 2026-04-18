-- Drop ALL existing policies on storage.objects scoped to apk-files (by known names)
DROP POLICY IF EXISTS "Anyone can upload APK files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files from apk-files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete APK files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update APK files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view APK files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read apk-files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload APK files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can list APK files" ON storage.objects;

-- Admins-only INSERT
CREATE POLICY "Only admins can upload APK files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'apk-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins-only UPDATE
CREATE POLICY "Only admins can update APK files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'apk-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'apk-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins-only DELETE
CREATE POLICY "Only admins can delete APK files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'apk-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins-only SELECT (listing). Direct public URLs still serve the file because bucket is public.
CREATE POLICY "Only admins can list APK files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'apk-files'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Lock down increment_download_count to authenticated callers only
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_download_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_download_count(uuid) TO authenticated;