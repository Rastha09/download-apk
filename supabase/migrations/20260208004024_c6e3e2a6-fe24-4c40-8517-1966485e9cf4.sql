
-- Add linkvertise_urls column to apk_uploads table
ALTER TABLE public.apk_uploads ADD COLUMN linkvertise_urls TEXT[] DEFAULT '{}';

-- Add update policy for admins to edit linkvertise URLs
CREATE POLICY "Only admins can update APK uploads"
ON public.apk_uploads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
