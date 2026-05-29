-- Production-readiness hardening — resolves outstanding Supabase advisor findings.
-- Applied to the production project (eoecnybevhxfdyzlodua) via the Supabase
-- management API; checked in here so the repo records the change.
--
-- Clears:
--   * performance / multiple_permissive_policies  (products, delivery_slots)
--   * security / public_bucket_allows_listing      (product-images)
--   * performance / unindexed_foreign_keys         (4 FKs)
--
-- The remaining advisor INFO items are intentional:
--   * rls_enabled_no_policy on admin_users / customer_addresses / profiles /
--     media_assets / order_idempotency_keys — these tables are only ever read
--     or written through the service-role client (which bypasses RLS), so
--     "RLS on, no policy" is the correct deny-by-default posture for anon/auth.

-- ── 1. Covering indexes for unindexed foreign keys ──────────────────────────
create index if not exists idx_customer_referrals_referred_order_id
  on public.customer_referrals (referred_order_id);
create index if not exists idx_media_assets_created_by
  on public.media_assets (created_by);
create index if not exists idx_product_images_media_asset_id
  on public.product_images (media_asset_id);
create index if not exists idx_product_stock_history_order_id
  on public.product_stock_history (order_id);

-- ── 2a. products: merge the two permissive SELECT policies into one ──────────
-- "public read active products" (anon+auth: is_active) and
-- "products staff select all" (auth: is_staff()) were both permissive for
-- authenticated SELECT. Permissive policies OR together, so a single policy
-- USING (is_active OR is_staff()) is provably equivalent and evaluated once.
drop policy if exists "products staff select all" on public.products;
drop policy if exists "public read active products" on public.products;
create policy "public read products" on public.products
  for select to public
  using (is_active = true or public.is_staff());

-- ── 2b. delivery_slots: scope the service-role policy to the service_role ────
-- It was granted to {public} with a current_setting('role') guard, so it was
-- evaluated for anon/authenticated SELECT too (always false for them). Scoping
-- TO service_role removes it from the anon/auth SELECT path entirely.
drop policy if exists "service role full access" on public.delivery_slots;
create policy "service role full access" on public.delivery_slots
  for all to service_role
  using (true) with check (true);

-- ── 3. Storage: stop anonymous listing of the product-images bucket ─────────
-- The broad SELECT policy let any client enumerate every object via the list
-- API. The bucket is public=true and the app only ever serves objects through
-- getPublicUrl() (public CDN), which does not require this policy — so dropping
-- it closes the enumeration surface with no impact on the storefront.
drop policy if exists "Public read product images" on storage.objects;
