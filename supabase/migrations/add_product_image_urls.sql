-- Migration: add multi-image support to products
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Add image_urls column
alter table products
  add column if not exists image_urls text[] not null default '{}';

-- 2. Populate image_urls from existing image_url for products that have one
update products
  set image_urls = array[image_url]
  where image_url is not null
    and image_url != ''
    and (image_urls is null or image_urls = '{}');

-- 3. Storage bucket for product images
-- NOTE: Run these separately in Supabase SQL editor (storage schema):

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- 4. Storage RLS policies (allow service role to upload/delete, public to read)
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "service role upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'service_role');

create policy "service role delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'service_role');
