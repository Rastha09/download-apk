-- Create storage bucket for APK files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('apk-files', 'apk-files', true, 524288000);

-- Create policy for public read access
CREATE POLICY "Public can read APK files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'apk-files');

-- Create policy for anyone to upload (can be restricted to admin later)
CREATE POLICY "Anyone can upload APK files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'apk-files');

-- Create table for APK metadata
CREATE TABLE public.apk_uploads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    app_name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    download_url TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.apk_uploads ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can see APK list)
CREATE POLICY "Anyone can view APK uploads"
ON public.apk_uploads
FOR SELECT
USING (true);

-- Create policy for public insert (can be restricted to admin later)
CREATE POLICY "Anyone can insert APK uploads"
ON public.apk_uploads
FOR INSERT
WITH CHECK (true);