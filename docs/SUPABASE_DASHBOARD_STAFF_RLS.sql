-- Staff RLS for dashboard tables (apply if orders/products RLS blocks JWT reads)
-- Requires public.is_staff() and public.current_user_role() from compat / schema migrations.

drop policy if exists "orders staff select" on public.orders;
create policy "orders staff select"
on public.orders for select
to authenticated
using (public.is_staff());

drop policy if exists "orders staff insert" on public.orders;
create policy "orders staff insert"
on public.orders for insert
to authenticated
with check (public.is_staff());

drop policy if exists "orders staff update" on public.orders;
create policy "orders staff update"
on public.orders for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "orders staff delete" on public.orders;
create policy "orders staff delete"
on public.orders for delete
to authenticated
using (public.is_staff());

drop policy if exists "products staff select all" on public.products;
create policy "products staff select all"
on public.products for select
to authenticated
using (public.is_staff());

drop policy if exists "products staff insert" on public.products;
create policy "products staff insert"
on public.products for insert
to authenticated
with check (public.is_staff());

drop policy if exists "products staff update" on public.products;
create policy "products staff update"
on public.products for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "products staff delete" on public.products;
create policy "products staff delete"
on public.products for delete
to authenticated
using (public.is_staff());

-- order_items: enable RLS + staff policies (prevents anon reads of line items)
alter table public.order_items enable row level security;

drop policy if exists "order_items staff select" on public.order_items;
create policy "order_items staff select"
on public.order_items for select
to authenticated
using (public.is_staff());

drop policy if exists "order_items staff insert" on public.order_items;
create policy "order_items staff insert"
on public.order_items for insert
to authenticated
with check (public.is_staff());

drop policy if exists "order_items staff update" on public.order_items;
create policy "order_items staff update"
on public.order_items for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "order_items staff delete" on public.order_items;
create policy "order_items staff delete"
on public.order_items for delete
to authenticated
using (public.is_staff());
