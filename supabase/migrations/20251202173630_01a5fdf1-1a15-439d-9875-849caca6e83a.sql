-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create new policy that allows viewing all products (so users can see status changes)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);