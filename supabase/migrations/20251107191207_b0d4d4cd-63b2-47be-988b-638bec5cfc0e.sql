-- 1) Create a SECURITY DEFINER helper to check admin role without triggering RLS recursion
create or replace function public.has_admin_role(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = _user_id
  );
$$;

-- Ensure only trusted roles can execute if desired (optional). Supabase defaults allow execution; keeping default.

-- 2) Fix recursive RLS on admins table
-- Drop existing recursive policies
drop policy if exists "Admins can insert new admins" on public.admins;
drop policy if exists "Only admins can view admin table" on public.admins;

-- Recreate non-recursive policies using the helper
create policy "Admins can insert new admins"
  on public.admins
  for insert
  with check (public.has_admin_role(auth.uid()));

create policy "Only admins can view admin table"
  on public.admins
  for select
  using (public.has_admin_role(auth.uid()));

-- 3) Update other tables to use has_admin_role instead of EXISTS (SELECT FROM admins ...)

-- products
drop policy if exists "Admins can delete any product" on public.products;
drop policy if exists "Admins can update any product" on public.products;
drop policy if exists "Approved products viewable by everyone or admin can see all" on public.products;

create policy "Admins can delete any product"
  on public.products
  for delete
  using (public.has_admin_role(auth.uid()));

create policy "Admins can update any product"
  on public.products
  for update
  using (public.has_admin_role(auth.uid()));

create policy "Approved products viewable by everyone or admin can see all"
  on public.products
  for select
  using (
    (approved = true) or (auth.uid() = user_id) or public.has_admin_role(auth.uid())
  );

-- app_settings
drop policy if exists "Admins can update settings" on public.app_settings;
drop policy if exists "Admins can view settings" on public.app_settings;

create policy "Admins can update settings"
  on public.app_settings
  for all
  using (public.has_admin_role(auth.uid()))
  with check (public.has_admin_role(auth.uid()));

create policy "Admins can view settings"
  on public.app_settings
  for select
  using (public.has_admin_role(auth.uid()));

-- admin_logs
drop policy if exists "Admins can insert logs" on public.admin_logs;
drop policy if exists "Admins can view all logs" on public.admin_logs;

create policy "Admins can insert logs"
  on public.admin_logs
  for insert
  with check (public.has_admin_role(auth.uid()));

create policy "Admins can view all logs"
  on public.admin_logs
  for select
  using (public.has_admin_role(auth.uid()));

-- profiles (admin-wide updates)
drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Admins can update any profile"
  on public.profiles
  for update
  using (public.has_admin_role(auth.uid()));

-- Note: Other existing non-admin policies (users updating own rows, public selects, etc.) are preserved.

-- 4) Optional seed: ensure existing admin user row persists (kept from prior migration)
-- (No-op if already exists)
insert into public.admins (user_id, email, role)
select u.id, u.email, coalesce('admin', 'admin')
from auth.users u
left join public.admins a on a.user_id = u.id
where u.email = 'admin@vit.edu' and a.user_id is null;
