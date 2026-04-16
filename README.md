# 🥦 TMFoodStuff

> Fresh Fruits & Vegetables delivered to your door across the UAE.

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Storefront | Next.js 15 (App Router) | Customer UI (EN / AR) |
| Admin dashboard | Next.js server routes | `/dashboard` — product, order & settings management |
| Database | Supabase (Postgres + RLS) | Products, orders, customers, settings, promo codes |
| Legacy CMS (optional) | Payload CMS 3.x | `/admin` — only enabled when `MONGODB_URI` is set |
| Payments | Cash on delivery (Telr card flow coming soon) | UAE-native payment gateway |
| Hosting | Vercel | Frontend + API |

## Project Structure

```
TMFoodStuff/
├── app/          # Next.js 15 storefront + /dashboard + optional Payload /admin
└── docs/         # Setup & deployment guides
```

## Quick Start

```bash
cd app
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY and DASHBOARD_PASSWORD.
npm run dev
# Storefront → http://localhost:3000
# Admin dashboard → http://localhost:3000/dashboard
```

See [`docs/SETUP.md`](docs/SETUP.md) for the full walkthrough, including
Supabase project setup.

## UAE Market

- **Currency:** AED
- **VAT:** 5% (Federal Tax Authority compliant)
- **Delivery:** Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, Umm Al Quwain
- **Payments:** Cash on Delivery (Telr card support coming soon)
- **Address:** Makani number support
