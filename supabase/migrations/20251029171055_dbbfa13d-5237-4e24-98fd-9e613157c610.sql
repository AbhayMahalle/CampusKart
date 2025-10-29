-- Add current users as admins
INSERT INTO public.admins (user_id, email, role)
VALUES 
  ('9ced3239-f78d-4ebf-8f97-a2e542c4b99c', 'abhay@gmail.com', 'admin'),
  ('8aa9b655-1d8d-4313-a094-11ea2372d049', 'abhay.mahalle24@vit.edu', 'admin')
ON CONFLICT (user_id) DO NOTHING;