-- Restock inventory when an order is cancelled (idempotent)

create or replace function public.cancel_order_restock(p_order_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if p_order_id is null then
    raise exception 'missing_order_id';
  end if;

  perform 1
  from public.orders o
  where o.id = p_order_id
    and o.status = 'cancelled'
    and coalesce(o.inventory_decremented, false) = true
    and coalesce(o.inventory_restocked, false) = false
  for update;

  if not found then
    return;
  end if;

  for r in
    select oi.product_id, sum(oi.quantity)::integer as qty
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_id is not null
    group by oi.product_id
    order by oi.product_id
  loop
    update public.products p
    set stock = coalesce(p.stock, 0) + r.qty,
        updated_at = timezone('utc', now())
    where p.id = r.product_id;
  end loop;

  update public.orders
  set inventory_restocked = true,
      updated_at = timezone('utc', now())
  where id = p_order_id;
end;
$$;

revoke all on function public.cancel_order_restock(integer) from public;
grant execute on function public.cancel_order_restock(integer) to service_role;
