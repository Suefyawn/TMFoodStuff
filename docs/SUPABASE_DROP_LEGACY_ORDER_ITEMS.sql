-- Optional cleanup: remove legacy JSON line-items column after verifying all reads use order_items.
-- Run only after backfill from docs/SUPABASE_COMPAT_MIGRATION.sql and operational validation.

alter table public.orders drop column if exists items;
