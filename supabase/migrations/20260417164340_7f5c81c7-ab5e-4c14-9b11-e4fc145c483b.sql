-- Add invited_by column
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Promote bawellanis7@gmail.com to super_admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'bawellanis7@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    -- Remove existing admin row (if any) to avoid duplicates
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'super_admin'::public.app_role);
  END IF;
END $$;

-- Helper: is current user super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  )
$$;

-- RLS: Super admin can view all roles
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS: Super admin can insert admin roles (but not super_admin)
DROP POLICY IF EXISTS "Super admins can insert admin roles" ON public.user_roles;
CREATE POLICY "Super admins can insert admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND role = 'admin'::public.app_role
);

-- RLS: Super admin can delete admin roles (but not super_admin rows)
DROP POLICY IF EXISTS "Super admins can delete admin roles" ON public.user_roles;
CREATE POLICY "Super admins can delete admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  AND role = 'admin'::public.app_role
);

-- Update has_role so 'admin' check also returns true for super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::public.app_role AND role = 'super_admin'::public.app_role)
      )
  )
$$;
