-- Add status column to profiles for user management (active/banned)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add admin activity logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies
CREATE POLICY "Admins can view all logs"
ON public.admin_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

-- Add app settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- App settings policies
CREATE POLICY "Admins can view settings"
ON public.app_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

-- Update RLS policies for products to allow admin access
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON public.products;
CREATE POLICY "Approved products viewable by everyone or admin can see all"
ON public.products
FOR SELECT
USING (
  (approved = true) 
  OR (auth.uid() = user_id)
  OR EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
);

-- Admin can update any product
CREATE POLICY "Admins can update any product"
ON public.products
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
);

-- Admin can delete any product
CREATE POLICY "Admins can delete any product"
ON public.products
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
);

-- Update profiles RLS to allow admin to update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
);

-- Insert default settings
INSERT INTO public.app_settings (key, value)
VALUES 
  ('site_name', '"CampusKart Admin"'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('registration_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;