# 🥦 TMFoodStuff

> Fresh Fruits & Vegetables delivered to your door across the UAE.

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Storefront | Next.js 15 (App Router) | Customer UI (EN / AR) |
| Admin dashboard | Next.js + Supabase Auth | `/dashboard` — product, order & settings management |
| Database | Supabase (Postgres + RLS) | Products, orders, customers, settings, promo codes |
| Payments | Cash on delivery + Stripe (card) | COD plus online card payments |
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
# Fill in your Supabase keys (NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
# See .env.example for the full annotated list.
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
- **Payments:** Cash on Delivery and online card payment via Stripe (AED)
- **Address:** Makani number support
