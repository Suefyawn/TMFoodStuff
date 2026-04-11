# TMFoodStuff

Fresh fruits and vegetables delivered across the UAE.

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Storefront | Next.js 15 | Customer UI |
| Admin | Custom dashboard (`/dashboard`) | Products, orders, settings |
| Database | Supabase (Postgres) | Data + RLS |
| Hosting | Vercel | Frontend + API routes |

Legacy Payload CMS and MongoDB have been removed from this app; use Supabase and the custom admin only.

## Project structure

```
TMFoodStuff/
├── app/                 # Next.js app (storefront + dashboard + APIs)
└── docs/                # SQL migrations, RPCs, cutover notes
```

## Quick start

```bash
cd app
npm install
cp .env.example .env
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

- Storefront: http://localhost:3000  
- Dashboard: http://localhost:3000/dashboard (Supabase Auth; staff users need `profiles` or `admin_users` as in the schema docs)

## Database

- Target schema and RLS: `docs/SUPABASE_SCHEMA.sql`
- Incremental compat migration: `docs/SUPABASE_COMPAT_MIGRATION.sql`
- Checkout RPC: `docs/SUPABASE_RPC_CREATE_CHECKOUT_ORDER.sql`
- Optional: drop legacy `orders.items` after validation: `docs/SUPABASE_DROP_LEGACY_ORDER_ITEMS.sql`

## Seeding catalog data

```bash
cd app
npm run seed
```

Uses `SUPABASE_SERVICE_ROLE_KEY` to upsert categories and products from `src/data/*`.

## Supabase migration notes

See `docs/PAYLOAD_TO_SUPABASE_CUTOVER.md` for field mapping and decommissioning checklist.
