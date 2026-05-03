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
  unit        text        not null default 'kg',
  stock       int         not null default 0,
  is_active   boolean     not null default true,
  is_featured boolean     not null default false,
  is_organic  boolean     not null default false,
  origin      text        not null default '',
  emoji       text        not null default '',
  image_url   text,
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

-- Settings: public read, service-role write
alter table settings enable row level security;
create policy "public read settings"   on settings for select using (true);
create policy "service write settings" on settings for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index if not exists idx_products_category  on products(category_id);
create index if not exists idx_products_is_active on products(is_active);
create index if not exists idx_products_slug      on products(slug);
create index if not exists idx_orders_status      on orders(status);
create index if not exists idx_orders_created_at  on orders(created_at desc);
create index if not exists idx_orders_order_number on orders(order_number);
