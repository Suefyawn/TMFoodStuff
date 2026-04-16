-- TMFoodStuff: compatibility migration for existing Supabase schema
-- Goal: evolve current live tables toward the custom-admin target shape
-- without destructive changes or downtime.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- Enums (idempotent)
-- ============================================================
do $$ begin
  create type public.user_role as enum ('owner', 'manager', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_unit as enum ('kg', 'g', 'piece', 'bunch', 'box', 'pack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'processing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cod', 'telr');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delivery_slot as enum ('morning', 'afternoon', 'evening');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Timestamp trigger helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================
-- Profiles table + bootstrap from admin_users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

insert into public.profiles (id, full_name, role, is_active)
select
  au.user_id,
  coalesce(split_part(au.email, '@', 1), ''),
  case when au.role = 'admin' then 'manager'::public.user_role else 'staff'::public.user_role end,
  coalesce(au.is_active, true)
from public.admin_users au
where au.user_id is not null
on conflict (id) do update set
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- ============================================================
-- Categories compatibility columns
-- ============================================================
alter table public.categories
  add column if not exists image_asset_id bigint,
  add column if not exists parent_id integer,
  add column if not exists display_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_by uuid,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$ begin
  alter table public.categories
  add constraint categories_parent_id_fkey
  foreign key (parent_id) references public.categories(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.categories
  add constraint categories_image_asset_id_fkey
  foreign key (image_asset_id) references public.media_assets(id) on delete set null;
exception when undefined_table then null;
exception when duplicate_object then null; end $$;

create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_display_order on public.categories(display_order);
create index if not exists idx_categories_is_active on public.categories(is_active);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

-- ============================================================
-- Products compatibility columns
-- ============================================================
alter table public.products
  add column if not exists description_ar text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists updated_by uuid,
  add column if not exists created_by uuid;

do $$ begin
  alter table public.products
  add constraint products_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.products
  add constraint products_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_products_created_at on public.products(created_at desc);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

-- ============================================================
-- media_assets + product_images
-- ============================================================
create table if not exists public.media_assets (
  id bigint generated by default as identity primary key,
  bucket text not null default 'product-images',
  storage_path text not null unique,
  public_url text,
  alt_text text,
  width integer,
  height integer,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at
before update on public.media_assets
for each row execute procedure public.set_updated_at();

create table if not exists public.product_images (
  id bigint generated by default as identity primary key,
  product_id integer not null references public.products(id) on delete cascade,
  media_asset_id bigint references public.media_assets(id) on delete set null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (media_asset_id is not null or image_url is not null)
);

create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_images_sort_order on public.product_images(sort_order);

drop trigger if exists trg_product_images_updated_at on public.product_images;
create trigger trg_product_images_updated_at
before update on public.product_images
for each row execute procedure public.set_updated_at();

-- Seed product_images from existing single image_url (idempotent)
insert into public.product_images (product_id, image_url, sort_order)
select p.id, p.image_url, 0
from public.products p
where p.image_url is not null
  and not exists (
    select 1
    from public.product_images pi
    where pi.product_id = p.id
  );

-- ============================================================
-- Customers + addresses
-- ============================================================
create table if not exists public.customers (
  id bigint generated by default as identity primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique,
  full_name text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_phone on public.customers(phone);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute procedure public.set_updated_at();

create table if not exists public.customer_addresses (
  id bigint generated by default as identity primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  label text,
  building text,
  street text,
  area text,
  emirate text,
  makani text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);
create index if not exists idx_customer_addresses_is_default on public.customer_addresses(customer_id, is_default);

drop trigger if exists trg_customer_addresses_updated_at on public.customer_addresses;
create trigger trg_customer_addresses_updated_at
before update on public.customer_addresses
for each row execute procedure public.set_updated_at();

-- ============================================================
-- Orders compatibility: add *_aed columns while preserving existing
-- ============================================================
alter table public.orders
  add column if not exists customer_id bigint,
  add column if not exists customer_full_name text,
  add column if not exists subtotal_aed numeric(10,2) not null default 0,
  add column if not exists vat_aed numeric(10,2) not null default 0,
  add column if not exists delivery_fee_aed numeric(10,2) not null default 0,
  add column if not exists promo_discount_aed numeric(10,2) not null default 0,
  add column if not exists total_aed numeric(10,2),
  add column if not exists placed_at timestamptz not null default timezone('utc', now());

do $$ begin
  alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.customers(id) on delete set null;
exception when duplicate_object then null; end $$;

-- Backfill from existing columns
update public.orders
set
  customer_full_name = coalesce(customer_full_name, customer_name),
  subtotal_aed = coalesce(subtotal_aed, subtotal, 0),
  vat_aed = coalesce(vat_aed, vat, 0),
  delivery_fee_aed = coalesce(delivery_fee_aed, delivery_fee, 0),
  promo_discount_aed = coalesce(promo_discount_aed, promo_discount, 0),
  total_aed = coalesce(total_aed, total),
  placed_at = coalesce(placed_at, created_at, timezone('utc', now()));

create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_customer_id on public.orders(customer_id);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

create table if not exists public.order_items (
  id bigint generated by default as identity primary key,
  order_id integer not null references public.orders(id) on delete cascade,
  product_id integer references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit text,
  unit_price_aed numeric(10,2) not null check (unit_price_aed >= 0),
  subtotal_aed numeric(10,2) not null check (subtotal_aed >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at
before update on public.order_items
for each row execute procedure public.set_updated_at();

-- Backfill order_items from legacy orders.items jsonb array
insert into public.order_items (order_id, product_id, product_name, quantity, unit, unit_price_aed, subtotal_aed)
select
  o.id,
  nullif(item->>'productId', '')::integer,
  coalesce(item->>'name', 'Unknown item'),
  greatest(coalesce((item->>'quantity')::integer, 1), 1),
  coalesce(item->>'unit', 'piece'),
  coalesce((item->>'priceAED')::numeric, (item->>'price_aed')::numeric, 0),
  coalesce((item->>'subtotal')::numeric, (item->>'subtotal_aed')::numeric, 0)
from public.orders o
cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) item
where not exists (
  select 1 from public.order_items oi where oi.order_id = o.id
);

-- ============================================================
-- Role helper: prefer profiles, fallback admin_users
-- ============================================================
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  with from_profiles as (
    select p.role
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
    limit 1
  ), from_admin_users as (
    select
      case
        when au.role = 'admin' then 'manager'::public.user_role
        else 'staff'::public.user_role
      end as role
    from public.admin_users au
    where au.user_id = auth.uid()
      and coalesce(au.is_active, true) = true
    limit 1
  )
  select coalesce(
    (select role from from_profiles),
    (select role from from_admin_users)
  )::public.user_role
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() in ('owner', 'manager', 'staff'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() in ('owner', 'manager'), false)
$$;

commit;
