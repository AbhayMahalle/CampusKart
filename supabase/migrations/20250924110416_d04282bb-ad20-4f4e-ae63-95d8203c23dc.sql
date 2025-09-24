-- Drop the foreign key constraint on products table to allow demo data
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_user_id_fkey;

-- Also drop constraint on flat_listings if it exists  
ALTER TABLE public.flat_listings DROP CONSTRAINT IF EXISTS flat_listings_user_id_fkey;