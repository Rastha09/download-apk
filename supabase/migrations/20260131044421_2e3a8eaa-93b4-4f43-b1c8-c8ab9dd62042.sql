-- Add RLS policy for deleting APK uploads
CREATE POLICY "Anyone can delete APK uploads"
ON public.apk_uploads
FOR DELETE
USING (true);

-- Add RLS policy for deleting files from storage
CREATE POLICY "Anyone can delete files from apk-files bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'apk-files');