-- Migration: admin allowlist for the /dashboard
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- The dashboard now authenticates with Supabase Auth (one login per staff
-- member). This table is the allowlist: only users whose email appears here
-- can access /dashboard and the /api/dashboard/* endpoints.
--
-- Setup:
--   1. Disable public sign-ups: Dashboard → Authentication → Providers →
--      Email → turn OFF "Allow new users to sign up".
--   2. Create each staff account: Dashboard → Authentication → Users → Add user.
--   3. Add the same email(s) to this table.

create table if not exists admin_users (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
create policy "service manage admin_users" on admin_users
  for all using (auth.role() = 'service_role');

-- Seed the first admin. Replace with your owner email before running, then
-- create a matching user in Supabase Auth with the same address.
insert into admin_users (email) values ('jetnine.inc@gmail.com')
on conflict (email) do nothing;
