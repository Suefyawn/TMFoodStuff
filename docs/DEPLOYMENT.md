# 🚀 TMFoodStuff — Deployment Guide

## Overview

| Service | Platform | Notes |
|---------|----------|-------|
| Storefront (Next.js) | Vercel | Free tier, edge CDN |
| Backend (Medusa) | Railway | Easy Docker deploy |
| Database (PostgreSQL) | Supabase | Managed, free tier |
| CMS (Sanity) | Sanity Cloud | Built-in hosting |
| Media | Cloudinary | CDN image delivery |

---

## 1. Database — Supabase

1. Create account at https://supabase.com
2. New project → note the **Connection String** (postgres://...)
3. Use the connection string as `DATABASE_URL` in your backend `.env`

```
DATABASE_URL=postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

---

## 2. CMS — Sanity Cloud

```bash
cd cms
npm run deploy
```

Your Sanity Studio will be hosted at: `https://your-project.sanity.studio`

To deploy GraphQL API:
```bash
npm run deploy-graphql
```

---

## 3. Backend — Railway

1. Create account at https://railway.app
2. **New Project → Deploy from GitHub** → select `TMFoodStuff` → `backend/`
3. Add environment variables in Railway dashboard:

```
DATABASE_URL=        (from Supabase)
REDIS_URL=           (Railway Redis addon)
JWT_SECRET=          (generate random 64 chars)
COOKIE_SECRET=       (generate random 64 chars)
STORE_CORS=          (your Vercel storefront URL)
ADMIN_CORS=          (your Vercel admin URL or Railway URL)
NODE_ENV=production
```

4. Railway will auto-detect `npm run start` and deploy.

---

## 4. Storefront — Vercel

1. Go to https://vercel.com → **Import Project** from GitHub
2. Set **Root Directory** to `storefront`
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=   (Railway backend URL, e.g. https://tmfoodstuff-backend.railway.app)
NEXT_PUBLIC_SANITY_PROJECT_ID=    (from sanity.io/manage)
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME= (from cloudinary.com)
NEXT_PUBLIC_BASE_URL=             (your Vercel URL, e.g. https://tmfoodstuff.vercel.app)
```

5. Deploy → Vercel provides a live URL instantly.

---

## Environment Variables Checklist

### Before going live, verify:

- [ ] `JWT_SECRET` is a random 64-char string (NOT "supersecret")
- [ ] `COOKIE_SECRET` is a random 64-char string (NOT "supersecret")
- [ ] `STORE_CORS` matches your actual storefront domain
- [ ] `ADMIN_CORS` matches your actual admin domain
- [ ] `DATABASE_URL` points to production Supabase
- [ ] `REDIS_URL` points to production Redis
- [ ] Cloudinary credentials are set
- [ ] Sanity project ID is correct
- [ ] UAE VAT is configured in Medusa (5% tax region for AE)
- [ ] AED currency region is created in Medusa admin

---

## Post-Deploy Checklist

1. [ ] Run Medusa migrations on production: `npx medusa migrations run`
2. [ ] Create admin user: `npx medusa user -e admin@tmfoodstuff.ae -p your_password`
3. [ ] Add AED currency in Medusa Admin → Regions → UAE
4. [ ] Set 5% VAT tax rate in Medusa Admin → Regions → UAE → Tax Rates
5. [ ] Upload product catalog
6. [ ] Test checkout flow end-to-end
7. [ ] Configure Telr or PayTabs payment plugin

---

## SSL / Domain

- Vercel: Custom domain via `vercel.com/domains` — SSL auto-provisioned
- Railway: Custom domain in Railway project settings
- Sanity: Custom domain via Sanity Studio settings

---

## Monitoring

- Vercel Analytics: Built-in (enable in Vercel dashboard)
- Railway Logs: Available in Railway dashboard
- Supabase Logs: Available at supabase.com → your project → Logs
