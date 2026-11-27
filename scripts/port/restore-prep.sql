-- Run on the throwaway restore-check database only (verify.yml), before pg_restore.
-- Supabase's own roles and the extensions schema, so policies, grants and defaults that
-- name them can be created. Nothing here touches the live project.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role', 'supabase_admin',
                           'supabase_auth_admin', 'supabase_storage_admin', 'authenticator', 'dashboard_user']
  loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end $$;
create schema if not exists extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;
