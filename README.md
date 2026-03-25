# 🥦 TMFoodStuff

> Fresh Fruits & Vegetables delivered to your door across the UAE.

## Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Storefront | Next.js 14 | Customer UI |
| Admin CMS | Payload CMS 2.x | Product & order management |
| Database | MongoDB Atlas | All data |
| Payments | Telr | UAE-native payment gateway |
| Hosting | Vercel | Frontend + API |

## Project Structure

```
TMFoodStuff/
├── app/          # Next.js 14 + Payload CMS (unified)
└── docs/         # Setup & deployment guides
```

## Quick Start

```bash
cd app
npm install
cp .env.example .env
# Fill in MONGODB_URI and PAYLOAD_SECRET
npm run dev
# Storefront → http://localhost:3000
# Admin panel → http://localhost:3000/admin
```

## UAE Market

- **Currency:** AED
- **VAT:** 5% (Federal Tax Authority compliant)
- **Delivery:** Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah
- **Payments:** Telr (UAE-licensed)
- **Address:** Makani number support
