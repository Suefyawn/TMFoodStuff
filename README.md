# 🥦 TMFoodStuff

> Fresh Fruits & Vegetables delivered to your door across the UAE.

A modern, full-stack e-commerce platform built for the UAE market — supporting AED currency, 5% VAT, Arabic RTL, and local payment gateways.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Storefront** | Next.js 14 (App Router) | Customer-facing UI |
| **Backend** | Medusa.js | E-commerce engine, orders, inventory |
| **Database** | PostgreSQL | Primary data store |
| **CMS** | Sanity.io | Banners, categories, site settings |
| **Media** | Cloudinary | Product images, optimization |
| **Payments** | Telr / PayTabs | UAE-licensed payment gateways |
| **Notifications** | WhatsApp Business API | Order confirmations |

---

## Project Structure

```
TMFoodStuff/
├── storefront/    # Next.js 14 — customer UI (port 3000)
├── backend/       # Medusa.js — API & commerce engine (port 9000)
├── cms/           # Sanity Studio — content management (port 3333)
└── docs/          # Setup, deployment, UAE specifics
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git

### 1. Storefront (Next.js)

```bash
cd storefront
npm install
cp .env.example .env.local
# Fill in your env values
npm run dev
# → http://localhost:3000
```

### 2. Backend (Medusa.js)

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET
npx medusa migrations run
npm run dev
# → http://localhost:9000
# Admin → http://localhost:7001
```

### 3. CMS (Sanity Studio)

```bash
cd cms
npm install
cp .env.example .env
# Fill in SANITY_STUDIO_PROJECT_ID
npm run dev
# → http://localhost:3333
```

---

## Environment Variables Reference

### storefront/.env.local

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa backend URL (default: http://localhost:9000) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: production) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_BASE_URL` | Storefront base URL |

### backend/.env

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (use random string in prod) |
| `COOKIE_SECRET` | Cookie signing secret (use random string in prod) |
| `STORE_CORS` | Storefront origin for CORS |
| `ADMIN_CORS` | Admin dashboard origin for CORS |

### cms/.env

| Variable | Description |
|----------|-------------|
| `SANITY_STUDIO_PROJECT_ID` | Sanity project ID |
| `SANITY_STUDIO_DATASET` | Sanity dataset |

---

## UAE Market Notes

- **Currency:** AED (د.إ) — prices stored in fils (1 fil = 0.01 AED)
- **VAT:** 5% — mandatory per UAE Federal Tax Authority; shown at checkout & on invoices
- **RTL:** Arabic language support via `next-intl`; Cairo font for Arabic text
- **Payments:** Telr (https://telr.com) and PayTabs (https://paytabs.com) — both UAE-licensed
- **WhatsApp:** Order confirmations via WhatsApp Business API (standard in UAE)
- **Delivery Zones:** Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah
- **Timezone:** GST — Gulf Standard Time (UTC+4)

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © TMFoodStuff
