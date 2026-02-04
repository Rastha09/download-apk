-- Add download_count column to apk_uploads table
ALTER TABLE public.apk_uploads 
ADD COLUMN download_count bigint NOT NULL DEFAULT 0;

-- Create a function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(apk_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.apk_uploads
  SET download_count = download_count + 1
  WHERE id = apk_id;
END;
$$;

-- Allow anyone to call this function (since downloads are public)
GRANT EXECUTE ON FUNCTION public.increment_download_count(uuid) TO anon, authenticated;