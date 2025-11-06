-- Ensure admin row exists for existing admin user by email
INSERT INTO public.admins (user_id, email, role)
SELECT u.id, u.email, 'admin'
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
WHERE u.email = 'admin@vit.edu' AND a.user_id IS NULL;