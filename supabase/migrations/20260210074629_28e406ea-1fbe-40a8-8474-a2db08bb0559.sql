
-- Create table for redirect slugs
CREATE TABLE public.apk_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apk_id UUID NOT NULL REFERENCES public.apk_uploads(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apk_redirects ENABLE ROW LEVEL SECURITY;

-- Anyone can read redirects (needed for /go/:slug)
CREATE POLICY "Anyone can view redirects"
ON public.apk_redirects
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Only admins can insert redirects"
ON public.apk_redirects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Only admins can delete redirects"
ON public.apk_redirects
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast slug lookups
CREATE INDEX idx_apk_redirects_slug ON public.apk_redirects(slug);
CREATE INDEX idx_apk_redirects_apk_id ON public.apk_redirects(apk_id);
