-- Atomic checkout order creation (orders + order_items)
-- Applied to Supabase as migration: create_checkout_order_rpc

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
begin
  if p_order is null then
    raise exception 'p_order is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'p_items must be a non-empty json array';
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
    placed_at,
    items
  )
  values (
    (p_order->>'order_number')::text,
    coalesce((p_order->>'status')::text, 'pending'),
    coalesce((p_order->>'payment_method')::text, 'cod'),
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
    (p_order->>'subtotal')::numeric,
    (p_order->>'subtotal_aed')::numeric,
    (p_order->>'vat')::numeric,
    (p_order->>'vat_aed')::numeric,
    (p_order->>'delivery_fee')::numeric,
    (p_order->>'delivery_fee_aed')::numeric,
    coalesce((p_order->>'promo_code')::text, ''),
    (p_order->>'promo_discount')::numeric,
    (p_order->>'promo_discount_aed')::numeric,
    (p_order->>'total')::numeric,
    (p_order->>'total_aed')::numeric,
    coalesce((p_order->>'placed_at')::timestamptz, timezone('utc', now())),
    p_order->'items'
  )
  returning public.orders.id, public.orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
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
      case
        when (v_item ? 'product_id') and (v_item->>'product_id') is not null and (v_item->>'product_id') <> ''
          then (v_item->>'product_id')::integer
        when (v_item ? 'id') and (v_item->>'id') is not null and (v_item->>'id') <> '' and (v_item->>'id') ~ '^[0-9]+$'
          then (v_item->>'id')::integer
        else null
      end,
      coalesce((v_item->>'product_name')::text, (v_item->>'name')::text, 'Unknown item'),
      greatest(coalesce((v_item->>'quantity')::integer, 1), 1),
      coalesce((v_item->>'unit')::text, 'kg'),
      coalesce((v_item->>'unit_price_aed')::numeric, (v_item->>'price_aed')::numeric, (v_item->>'priceAED')::numeric, 0),
      coalesce(
        (v_item->>'subtotal_aed')::numeric,
        (v_item->>'subtotal')::numeric,
        coalesce((v_item->>'unit_price_aed')::numeric, (v_item->>'price_aed')::numeric, (v_item->>'priceAED')::numeric, 0)
          * greatest(coalesce((v_item->>'quantity')::integer, 1), 1)
      )
    );
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.create_checkout_order(jsonb, jsonb) from public;
grant execute on function public.create_checkout_order(jsonb, jsonb) to service_role;
