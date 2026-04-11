-- Atomic checkout: orders + order_items + stock decrement
-- Aggregates duplicate cart lines per product_id before locking rows
-- Validates unit prices against products.price_aed, validates totals, validates promo against promo_codes
-- Does NOT write legacy orders.items JSON

create or replace function public.create_checkout_order(p_order jsonb, p_items jsonb)
returns table (id integer, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id integer;
  v_order_number text;
  v_item jsonb;

  v_subtotal numeric := 0;
  v_vat numeric := 0;
  v_delivery_fee numeric := 0;
  v_total numeric := 0;

  v_client_subtotal numeric;
  v_client_vat numeric;
  v_client_delivery_fee numeric;
  v_client_promo_discount numeric;
  v_client_total numeric;

  v_promo_code text;
  v_promo_discount numeric := 0;
  v_promo_percent integer;

  v_payment_method text;

  v_pid integer;
  v_qty integer;
  v_unit_price numeric;
  v_db_price numeric;
  v_stock integer;

  v_expected_promo_discount numeric := 0;

  r record;
begin
  if p_order is null then
    raise exception 'p_order is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'p_items must be a non-empty json array';
  end if;

  v_client_subtotal := (p_order->>'subtotal')::numeric;
  v_client_vat := (p_order->>'vat')::numeric;
  v_client_delivery_fee := (p_order->>'delivery_fee')::numeric;
  v_client_promo_discount := coalesce((p_order->>'promo_discount')::numeric, 0);
  v_client_total := (p_order->>'total')::numeric;

  v_promo_code := coalesce(nullif(trim((p_order->>'promo_code')::text), ''), '');
  v_payment_method := lower(coalesce((p_order->>'payment_method')::text, 'cod'));

  if v_payment_method not in ('cod', 'telr') then
    raise exception 'invalid_payment_method';
  end if;

  create temporary table tmp_cart_lines (
    product_id integer not null,
    qty integer not null,
    product_name text not null,
    unit text not null,
    unit_price_client numeric not null
  ) on commit drop;

  insert into tmp_cart_lines (product_id, qty, product_name, unit, unit_price_client)
  select
    x.product_id,
    sum(x.qty)::integer,
    max(x.product_name)::text,
    max(x.unit)::text,
    max(x.unit_price_client)::numeric
  from (
    select
      case
        when (v_item ? 'product_id') and (v_item->>'product_id') is not null and (v_item->>'product_id') <> ''
          then (v_item->>'product_id')::integer
        when (v_item ? 'id') and (v_item->>'id') is not null and (v_item->>'id') <> '' and (v_item->>'id') ~ '^[0-9]+$'
          then (v_item->>'id')::integer
        else null
      end as product_id,
      greatest(coalesce((v_item->>'quantity')::integer, 1), 1) as qty,
      coalesce((v_item->>'product_name')::text, (v_item->>'name')::text, 'Unknown item') as product_name,
      coalesce((v_item->>'unit')::text, 'kg') as unit,
      coalesce(
        (v_item->>'unit_price_aed')::numeric,
        (v_item->>'price_aed')::numeric,
        (v_item->>'priceAED')::numeric,
        0
      ) as unit_price_client
    from jsonb_array_elements(p_items) v_item
  ) x
  where x.product_id is not null
  group by x.product_id;

  if not exists (select 1 from tmp_cart_lines) then
    raise exception 'invalid_product_id';
  end if;

  for r in select * from tmp_cart_lines order by product_id
  loop
    v_pid := r.product_id;
    v_qty := r.qty;

    select p.price_aed, coalesce(p.stock, 0)
      into v_db_price, v_stock
    from public.products p
    where p.id = v_pid
      and coalesce(p.is_active, true) = true
    for update;

    if v_db_price is null then
      raise exception 'unknown_or_inactive_product:%', v_pid;
    end if;

    if v_stock < v_qty then
      raise exception 'insufficient_stock:%', v_pid;
    end if;

    v_unit_price := r.unit_price_client;
    if abs(v_unit_price - v_db_price) > 0.02 then
      raise exception 'price_mismatch:%', v_pid;
    end if;

    v_subtotal := v_subtotal + (v_db_price * v_qty);
  end loop;

  v_vat := round(v_subtotal * 0.05, 2);
  v_delivery_fee := 0;

  if v_promo_code <> '' then
    select pc.discount_percent
      into v_promo_percent
    from public.promo_codes pc
    where upper(pc.code) = upper(v_promo_code)
      and pc.is_active = true
      and (pc.expires_at is null or pc.expires_at > timezone('utc', now()))
    limit 1;

    if v_promo_percent is null then
      raise exception 'invalid_promo_code';
    end if;

    v_expected_promo_discount := round(v_subtotal * (v_promo_percent::numeric / 100.0), 2);
    if abs(v_client_promo_discount - v_expected_promo_discount) > 0.02 then
      raise exception 'promo_discount_mismatch';
    end if;

    v_promo_discount := v_expected_promo_discount;
  else
    if v_client_promo_discount <> 0 then
      raise exception 'promo_discount_without_code';
    end if;
    v_promo_discount := 0;
  end if;

  v_total := round(v_subtotal + v_vat + v_delivery_fee - v_promo_discount, 2);

  if abs(v_client_subtotal - v_subtotal) > 0.02 then
    raise exception 'subtotal_mismatch';
  end if;
  if abs(v_client_vat - v_vat) > 0.02 then
    raise exception 'vat_mismatch';
  end if;
  if abs(v_client_delivery_fee - v_delivery_fee) > 0.02 then
    raise exception 'delivery_fee_mismatch';
  end if;
  if abs(v_client_total - v_total) > 0.02 then
    raise exception 'total_mismatch';
  end if;

  insert into public.orders (
    order_number,
    status,
    payment_method,
    customer_name,
    customer_full_name,
    customer_phone,
    customer_email,
    delivery_emirate,
    delivery_area,
    delivery_building,
    delivery_makani,
    delivery_slot,
    delivery_notes,
    subtotal,
    subtotal_aed,
    vat,
    vat_aed,
    delivery_fee,
    delivery_fee_aed,
    promo_code,
    promo_discount,
    promo_discount_aed,
    total,
    total_aed,
    placed_at
  )
  values (
    (p_order->>'order_number')::text,
    coalesce((p_order->>'status')::text, 'pending'),
    v_payment_method,
    (p_order->>'customer_name')::text,
    (p_order->>'customer_full_name')::text,
    (p_order->>'customer_phone')::text,
    coalesce((p_order->>'customer_email')::text, ''),
    (p_order->>'delivery_emirate')::text,
    (p_order->>'delivery_area')::text,
    coalesce((p_order->>'delivery_building')::text, ''),
    coalesce((p_order->>'delivery_makani')::text, ''),
    (p_order->>'delivery_slot')::text,
    coalesce((p_order->>'delivery_notes')::text, ''),
    v_subtotal,
    v_subtotal,
    v_vat,
    v_vat,
    v_delivery_fee,
    v_delivery_fee,
    v_promo_code,
    v_promo_discount,
    v_promo_discount,
    v_total,
    v_total,
    coalesce((p_order->>'placed_at')::timestamptz, timezone('utc', now()))
  )
  returning public.orders.id, public.orders.order_number into v_order_id, v_order_number;

  for r in select * from tmp_cart_lines order by product_id
  loop
    v_pid := r.product_id;
    v_qty := r.qty;

    select p.price_aed into v_db_price
    from public.products p
    where p.id = v_pid
      and coalesce(p.is_active, true) = true
    for update;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit,
      unit_price_aed,
      subtotal_aed
    )
    values (
      v_order_id,
      v_pid,
      r.product_name,
      v_qty,
      r.unit,
      v_db_price,
      round(v_db_price * v_qty, 2)
    );

    update public.products
    set stock = coalesce(stock, 0) - v_qty,
        updated_at = timezone('utc', now())
    where id = v_pid;
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.create_checkout_order(jsonb, jsonb) from public;
grant execute on function public.create_checkout_order(jsonb, jsonb) to service_role;
