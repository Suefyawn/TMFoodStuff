-- Public-safe promo validation (reads promo_codes via SECURITY DEFINER)

create or replace function public.validate_promo_code(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.promo_codes%rowtype;
  v_discount numeric;
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_code');
  end if;

  if p_subtotal is null or p_subtotal < 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_subtotal');
  end if;

  select * into v_row
  from public.promo_codes pc
  where upper(pc.code) = upper(trim(p_code))
    and pc.is_active = true
    and (pc.expires_at is null or pc.expires_at > timezone('utc', now()))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  v_discount := round(p_subtotal * (v_row.discount_percent::numeric / 100.0), 2);

  return jsonb_build_object(
    'ok', true,
    'code', v_row.code,
    'discount_percent', v_row.discount_percent,
    'discount_aed', v_discount
  );
end;
$$;

revoke all on function public.validate_promo_code(text, numeric) from public;
grant execute on function public.validate_promo_code(text, numeric) to anon, authenticated, service_role;
