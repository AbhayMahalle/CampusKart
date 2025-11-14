-- 1. Drop admin-related tables
DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 2. Drop admin helper function
DROP FUNCTION IF EXISTS public.has_admin_role(uuid) CASCADE;

-- 3. Drop admin trigger function
DROP FUNCTION IF EXISTS public.handle_admin_user() CASCADE;

-- 4. Update products table - remove approval requirement
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete any product" ON public.products;
DROP POLICY IF EXISTS "Admins can update any product" ON public.products;
DROP POLICY IF EXISTS "Approved products viewable by everyone or admin can see all" ON public.products;

-- Create new simple policies without admin checks
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Users can view their own products"
  ON public.products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Keep existing user policies (already exist, no changes needed)
-- "Users can create their own products"
-- "Users can update their own products"
-- "Users can delete their own products"

-- 5. Update profiles table - remove admin update policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 6. Remove approved column requirement from products (make all products visible)
-- Update existing products to be available
UPDATE public.products SET approved = true WHERE approved = false;