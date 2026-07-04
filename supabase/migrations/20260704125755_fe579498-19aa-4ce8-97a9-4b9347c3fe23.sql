
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  storage_path TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutorials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutorials are viewable by everyone"
  ON public.tutorials FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert tutorials"
  ON public.tutorials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update tutorials"
  ON public.tutorials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete tutorials"
  ON public.tutorials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER tutorials_set_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for tutorial-videos bucket
CREATE POLICY "Tutorial videos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tutorial-videos');

CREATE POLICY "Admins can upload tutorial videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tutorial-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update tutorial videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tutorial-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete tutorial videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tutorial-videos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
