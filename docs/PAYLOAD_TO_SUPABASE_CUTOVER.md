# Payload -> Supabase Cutover Playbook

This document is tailored to TMFoodStuff's current Payload collections:

- `products`
- `categories`
- `orders`
- `customers`
- `users`
- `media`

Use it together with `docs/SUPABASE_SCHEMA.sql`.

---

## 1) Target architecture

- **Storefront reads** from Supabase (`products`, `categories`, etc.)
- **Custom admin** under `/dashboard` writes to Supabase
- **Supabase Auth + RLS** controls admin/customer permissions
- **Payload** remains read-only only during transition, then removed

---

## 2) Field mapping (Payload -> Supabase)

### Categories

| Payload field | Supabase column |
|---|---|
| `name` | `categories.name` |
| `nameAr` | `categories.name_ar` |
| `slug` | `categories.slug` |
| `description` | `categories.description` |
| `image` | `categories.image_asset_id` (or `media_assets.public_url`) |
| `emoji` | `categories.emoji` |
| `parent` | `categories.parent_id` |
| `order` | `categories.display_order` |

### Products

| Payload field | Supabase column |
|---|---|
| `name` | `products.name` |
| `nameAr` | `products.name_ar` |
| `slug` | `products.slug` |
| `category` | `products.category_id` |
| `description` | `products.description` |
| `descriptionAr` | `products.description_ar` |
| `priceAED` | `products.price_aed` |
| `compareAtPriceAED` | `products.compare_at_price_aed` |
| `unit` | `products.unit` |
| `stock` | `products.stock` |
| `isActive` | `products.is_active` |
| `isFeatured` | `products.is_featured` |
| `isOrganic` | `products.is_organic` |
| `origin` | `products.origin` |
| `emoji` | `products.emoji` |
| `images[]` | `product_images` (+ `media_assets`) |
| `tags` (csv) | `products.tags` (`text[]`) |

### Customers

| Payload field | Supabase column |
|---|---|
| `email` | `customers.email` |
| `name` | `customers.full_name` |
| `phone` | `customers.phone` |
| `savedAddresses[]` | `customer_addresses` |

### Orders

| Payload field | Supabase column |
|---|---|
| `orderNumber` | `orders.order_number` |
| `status` | `orders.status` |
| `paymentMethod` | `orders.payment_method` |
| `paymentStatus` | `orders.payment_status` |
| `customer.fullName` | `orders.customer_full_name` |
| `customer.phone` | `orders.customer_phone` |
| `customer.email` | `orders.customer_email` |
| `delivery.emirate` | `orders.delivery_emirate` |
| `delivery.area` | `orders.delivery_area` |
| `delivery.building` | `orders.delivery_building` |
| `delivery.makani` | `orders.delivery_makani` |
| `delivery.slot` | `orders.delivery_slot` |
| `delivery.notes` | `orders.delivery_notes` |
| `pricing.subtotal` | `orders.subtotal_aed` |
| `pricing.vat` | `orders.vat_aed` |
| `pricing.deliveryFee` | `orders.delivery_fee_aed` |
| `pricing.promoCode` | `orders.promo_code` |
| `pricing.promoDiscount` | `orders.promo_discount_aed` |
| `pricing.total` + `totalAED` | `orders.total_aed` |
| `items[]` | `order_items[]` |

### Admin users (Payload `users`)

| Payload field | Supabase column |
|---|---|
| `email` | `auth.users.email` |
| `name` | `profiles.full_name` |
| `role` (`admin/staff`) | `profiles.role` (`owner/manager/staff`) |

---

## 3) Migration execution plan

1. **Apply schema**
   - Run `docs/SUPABASE_SCHEMA.sql` in Supabase SQL editor.
2. **Create storage bucket**
   - Create `product-images` bucket in Supabase Storage.
3. **Seed admin identities**
   - Create admin users in Supabase Auth.
   - Insert matching rows in `profiles`.
4. **Export Payload data**
   - Export collections from Mongo/Payload to JSON (or script direct read).
5. **Transform and import in order**
   - `media_assets` -> `categories` -> `products` -> `product_images`
   - `customers` -> `customer_addresses`
   - `orders` -> `order_items`
6. **Run validation checks**
   - Record counts, unique slugs, null critical fields, monetary totals.
7. **Switch storefront reads**
   - Point product/category/customer/order queries to Supabase only.
8. **Switch admin writes**
   - Ensure `/dashboard` uses Supabase Auth sessions (not static password).
9. **Freeze Payload writes**
   - Read-only mode for a short verification window.
10. **Cutover complete**
   - Remove Payload routes/config/deps after successful verification.

---

## 4) Validation checklist (must pass before Payload removal)

- [ ] Category count matches source
- [ ] Product count matches source
- [ ] Order count matches source
- [ ] Customer count matches source
- [ ] Every product has valid `category_id`
- [ ] Every order has >= 1 `order_items` row
- [ ] `sum(order_items.subtotal_aed)` approximately matches `orders.subtotal_aed`
- [ ] No duplicate product/category slugs
- [ ] Dashboard CRUD works for products/categories/orders
- [ ] Customer can only view own orders (RLS verified)
- [ ] Anonymous users cannot access admin rows

---

## 5) Recommended SQL validation snippets

```sql
-- Counts
select 'categories' as table_name, count(*) from categories
union all select 'products', count(*) from products
union all select 'customers', count(*) from customers
union all select 'orders', count(*) from orders
union all select 'order_items', count(*) from order_items;

-- Orphan products
select p.id, p.name
from products p
left join categories c on c.id = p.category_id
where c.id is null;

-- Orders without items
select o.id, o.order_number
from orders o
left join order_items oi on oi.order_id = o.id
group by o.id, o.order_number
having count(oi.id) = 0;
```

---

## 6) Immediate security upgrades for current dashboard code

Current dashboard API uses a static cookie password (`DASHBOARD_PASSWORD`).
Replace this with Supabase Auth JWT/session checks before go-live:

- Require authenticated user
- Resolve role from `profiles`
- Allow writes only for `owner/manager/staff` as intended
- Keep service-role use server-side only

---

## 7) Decommission checklist (Payload removal)

- [x] Remove `src/payload.config.ts` usage (removed from repo)
- [ ] Remove `src/collections/*` once fully migrated
- [x] Remove `(payload)` routes (`/admin`, `/api/[...slug]`) (removed from repo)
- [ ] Remove Payload dependencies from `package.json`
- [x] Remove MongoDB env vars from app `.env.example` (legacy docs flagged in SETUP/DEPLOYMENT)
- [ ] Update setup/deployment docs to Supabase-only

When all checks pass, Payload can be removed safely.
