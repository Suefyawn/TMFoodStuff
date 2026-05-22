-- Migration: back-in-stock notification signups
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- The /api/notify-stock route and the dashboard "back in stock" emails
-- already query this table; it was missing from the original schema.

create table if not exists stock_notifications (
  id          bigint generated always as identity primary key,
  product_id  bigint      not null references products(id) on delete cascade,
  email       text        not null,
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (product_id, email)
);

alter table stock_notifications enable row level security;
create policy "service manage stock_notifications" on stock_notifications
  for all using (auth.role() = 'service_role');

create index if not exists idx_stock_notifications_product on stock_notifications(product_id);
