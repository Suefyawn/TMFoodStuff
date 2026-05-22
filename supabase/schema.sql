-- TMFoodStuff — Supabase schema
-- Run this in the Supabase SQL editor to set up all tables and RLS policies.

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
create table if not exists categories (
  id         bigint generated always as identity primary key,
  name       text        not null,
  name_ar    text        not null default '',
  slug       text        not null unique,
  emoji      text        not null default '',
  description text       not null default '',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text        not null,
  name_ar     text        not null default '',
  slug        text        not null unique,
  description text        not null default '',
  price_aed   numeric(10,2) not null default 0,
  compare_at_price_aed numeric(10,2),
  unit        text        not null default 'kg',
  stock       int         not null default 0,
  is_active   boolean     not null default true,
  is_featured boolean     not null default false,
  is_organic  boolean     not null default false,
  origin      text        not null default '',
  emoji       text        not null default '',
  image_url   text,
  image_urls  text[]      not null default '{}',
  category_id bigint references categories(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
create table if not exists customers (
  id         bigint generated always as identity primary key,
  name       text        not null,
  phone      text        not null unique,
  email      text        not null default '',
  emirate    text        not null default '',
  area       text        not null default '',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
create table if not exists orders (
  id                  bigint generated always as identity primary key,
  order_number        text        not null unique,
  status              text        not null default 'pending'
                        check (status in ('pending','confirmed','processing','out_for_delivery','delivered','cancelled')),
  payment_method      text        not null default 'cod',
  payment_status      text        not null default 'pending',
  locale              text        not null default 'en',
  stripe_session_id        text,
  stripe_payment_intent_id text,

  -- customer snapshot (duplicated so orders survive customer edits/deletes)
  customer_name       text        not null default '',
  customer_full_name  text        not null default '',
  customer_phone      text        not null default '',
  customer_email      text        not null default '',

  -- delivery
  delivery_emirate    text        not null default '',
  delivery_area       text        not null default '',
  delivery_building   text        not null default '',
  delivery_makani     text        not null default '',
  delivery_slot       text        not null default '',
  delivery_notes      text        not null default '',

  -- financials (canonical _aed columns; plain aliases kept for compatibility)
  subtotal            numeric(10,2) not null default 0,
  subtotal_aed        numeric(10,2) not null default 0,
  vat                 numeric(10,2) not null default 0,
  vat_aed             numeric(10,2) not null default 0,
  delivery_fee        numeric(10,2) not null default 0,
  delivery_fee_aed    numeric(10,2) not null default 0,
  promo_code          text        not null default '',
  promo_discount      numeric(10,2) not null default 0,
  promo_discount_aed  numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  total_aed           numeric(10,2) not null default 0,

  -- line items stored as JSON
  items               jsonb       not null default '[]',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────
-- PROMO CODES
-- ─────────────────────────────────────────
create table if not exists promo_codes (
  id               bigint generated always as identity primary key,
  code             text        not null unique,
  discount_percent numeric(5,2) not null default 0,
  is_active        boolean     not null default true,
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SETTINGS  (key-value store)
-- ─────────────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- Default settings
insert into settings (key, value) values
  ('whatsapp_number', '971544408411'),
  ('vat_rate',        '5'),
  ('delivery_fee',    '15'),
  ('free_delivery_threshold', '150'),
  ('store_name',      'TMFoodStuff'),
  ('store_email',     ''),
  ('instagram_url',   ''),
  ('facebook_url',    '')
on conflict (key) do nothing;

-- ─────────────────────────────────────────
-- STOCK NOTIFICATIONS  (back-in-stock signups)
-- ─────────────────────────────────────────
create table if not exists stock_notifications (
  id          bigint generated always as identity primary key,
  product_id  bigint      not null references products(id) on delete cascade,
  email       text        not null,
  locale      text        not null default 'en',
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (product_id, email)
);

-- ─────────────────────────────────────────
-- ADMIN USERS  (allowlist for the /dashboard, paired with Supabase Auth)
-- ─────────────────────────────────────────
create table if not exists admin_users (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- Seed the first admin. Replace with your owner email before running, then
-- create a matching user in Supabase Auth with the same address.
insert into admin_users (email) values ('jetnine.inc@gmail.com')
on conflict (email) do nothing;

-- ─────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────

-- Atomic stock decrement used by /api/orders. The conditional WHERE prevents
-- concurrent orders from overselling / driving stock negative.
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

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Categories: public read, service-role write
alter table categories enable row level security;
create policy "public read categories"  on categories for select using (true);
create policy "service write categories" on categories for all using (auth.role() = 'service_role');

-- Products: public read active products, service-role write
alter table products enable row level security;
create policy "public read active products" on products for select using (is_active = true);
create policy "service write products"      on products for all using (auth.role() = 'service_role');

-- Orders: no public access, service-role only
alter table orders enable row level security;
create policy "service manage orders" on orders for all using (auth.role() = 'service_role');

-- Customers: no public access, service-role only
alter table customers enable row level security;
create policy "service manage customers" on customers for all using (auth.role() = 'service_role');

-- Promo codes: public read active codes (needed for checkout validation), service-role write
alter table promo_codes enable row level security;
create policy "public read active promos" on promo_codes for select using (is_active = true);
create policy "service write promos"      on promo_codes for all using (auth.role() = 'service_role');

-- Settings: public read, service-role write
alter table settings enable row level security;
create policy "public read settings"   on settings for select using (true);
create policy "service write settings" on settings for all using (auth.role() = 'service_role');

-- Stock notifications: no public access, service-role only
alter table stock_notifications enable row level security;
create policy "service manage stock_notifications" on stock_notifications for all using (auth.role() = 'service_role');

-- Admin users: no public access, service-role only
alter table admin_users enable row level security;
create policy "service manage admin_users" on admin_users for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index if not exists idx_products_category  on products(category_id);
create index if not exists idx_products_is_active on products(is_active);
create index if not exists idx_products_slug      on products(slug);
create index if not exists idx_orders_status      on orders(status);
create index if not exists idx_orders_created_at  on orders(created_at desc);
create index if not exists idx_orders_order_number on orders(order_number);
create index if not exists idx_stock_notifications_product on stock_notifications(product_id);

-- ─────────────────────────────────────────
-- EMAIL SUBSCRIBERS
-- ─────────────────────────────────────────
create table if not exists email_subscribers (
  id         bigint generated always as identity primary key,
  email      text        not null unique,
  created_at timestamptz not null default now()
);

alter table email_subscribers enable row level security;
create policy "service manage subscribers" on email_subscribers for all using (auth.role() = 'service_role');

create index if not exists idx_subscribers_email on email_subscribers(email);
