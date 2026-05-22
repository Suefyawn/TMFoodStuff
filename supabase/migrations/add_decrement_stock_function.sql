-- Migration: atomic stock decrement
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Used by /api/orders to decrement product stock when an order is placed.
-- The conditional WHERE makes the decrement atomic, so concurrent orders
-- cannot drive stock negative / oversell.

create or replace function decrement_stock(p_id bigint, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update products
    set stock = stock - p_qty
    where id = p_id and stock >= p_qty;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;
