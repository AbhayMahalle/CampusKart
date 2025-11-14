-- Function to automatically add admin@vit.edu to admins table
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user's email is admin@vit.edu
  IF NEW.email = 'admin@vit.edu' THEN
    -- Insert into admins table if not already there
    INSERT INTO public.admins (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for admin auto-creation
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();