ALTER TABLE public.license_keys 
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS telegram_id text;