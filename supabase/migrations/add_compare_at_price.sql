-- Migration: add sale ("compare-at") price to products
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- The storefront and dashboard already read/write `compare_at_price_aed`
-- (strike-through "was" price + discount badge); this column was missing
-- from the original schema.

alter table products
  add column if not exists compare_at_price_aed numeric(10,2);
