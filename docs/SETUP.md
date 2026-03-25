# 🛠️ TMFoodStuff — Setup Guide

## Prerequisites

| Requirement | Minimum Version | Install |
|-------------|----------------|---------|
| Node.js | 18.x | https://nodejs.org |
| npm | 9.x | Bundled with Node |
| PostgreSQL | 14+ | https://postgresql.org |
| Redis | 6+ | https://redis.io |
| Git | Any | https://git-scm.com |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Suefyawn/TMFoodStuff.git
cd TMFoodStuff
```

---

## Step 2: Storefront (Next.js 14)

```bash
cd storefront
npm install
```

Copy and configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Start development server:

```bash
npm run dev
```

✅ Storefront running at **http://localhost:3000**

---

## Step 3: Backend (Medusa.js)

### 3.1 — Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE tmfoodstuff;
```

### 3.2 — Install & Configure

```bash
cd ../backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgres://postgres:your_password@localhost:5432/tmfoodstuff
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_random_64char_string
COOKIE_SECRET=replace_with_random_64char_string
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7001
```

### 3.3 — Run Migrations

```bash
npx medusa migrations run
```

### 3.4 — Start Server

```bash
npm run dev
```

✅ Medusa API at **http://localhost:9000**  
✅ Admin dashboard at **http://localhost:7001**

---

## Step 4: CMS (Sanity Studio)

```bash
cd ../cms
npm install
cp .env.example .env
```

Edit `.env`:

```env
SANITY_STUDIO_PROJECT_ID=your_sanity_project_id
SANITY_STUDIO_DATASET=production
```

> 📝 Get your project ID from https://sanity.io/manage

Start Sanity Studio:

```bash
npm run dev
```

✅ Sanity Studio at **http://localhost:3333**

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Storefront (Next.js) | 3000 | http://localhost:3000 |
| Backend (Medusa API) | 9000 | http://localhost:9000 |
| Medusa Admin | 7001 | http://localhost:7001 |
| Sanity Studio | 3333 | http://localhost:3333 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## Troubleshooting

**`ECONNREFUSED` on Medusa backend?**  
→ Make sure PostgreSQL and Redis are running.

**Sanity schema not showing?**  
→ Run `npm run dev` inside `cms/` and check `schemas/index.ts` exports.

**Images not loading?**  
→ Check `storefront/next.config.js` — ensure Cloudinary and Sanity CDN domains are whitelisted.
