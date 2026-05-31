-- Audit follow-up: two atomic RPCs. Applied to the production project via the
-- Supabase management API; checked in here for the repo record.
--
-- increment_stock — mirrors decrement_stock. Used by the refund restock path,
--   which previously read/wrote a non-existent `stock_quantity` column and so
--   silently never returned inventory (while the audit log claimed it did).
--
-- redeem_points — closes a loyalty-points double-spend race. The order route
--   used to read the balance and then insert the debit in two steps, so
--   concurrent checkouts could each spend the same points. This serialises per
--   customer with an advisory lock, re-checks the live (non-expired) balance,
--   and only inserts the debit when it can be covered.

create or replace function increment_stock(p_id bigint, p_qty int)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated int;
begin
  update products set stock = stock + p_qty where id = p_id;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

create or replace function redeem_points(
  p_customer_id bigint,
  p_order_id bigint,
  p_points int,
  p_aed numeric,
  p_order_number text
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bal int;
begin
  if p_points <= 0 then
    return true;
  end if;
  perform pg_advisory_xact_lock(p_customer_id);
  select coalesce(sum(delta), 0) into bal
    from customer_points_ledger
    where customer_id = p_customer_id
      and (expires_at is null or expires_at > now());
  if bal < p_points then
    return false;
  end if;
  insert into customer_points_ledger (customer_id, order_id, delta, reason, description)
  values (
    p_customer_id, p_order_id, -p_points, 'order_redeemed',
    'Redeemed ' || p_points || ' pts for AED ' || to_char(p_aed, 'FM999990.00') ||
    ' on order ' || p_order_number
  );
  return true;
end;
$$;

revoke all on function increment_stock(bigint, int) from anon, authenticated;
revoke all on function redeem_points(bigint, bigint, int, numeric, text) from anon, authenticated;
