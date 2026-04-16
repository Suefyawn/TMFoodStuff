# 🛠️ Local Development Setup Guide

This guide walks you through setting up TMFoodStuff on your local machine from scratch.

> **Heads up.** The live storefront and admin (`/dashboard`) are powered by
> **Supabase** (Postgres). The legacy Payload CMS admin at `/admin` still
> ships in the codebase but is **optional** and only activates when
> `MONGODB_URI` is configured. For day-to-day operations use `/dashboard`.

---

## Prerequisites

### 1. Node.js (v18 or higher)

```bash
node --version
```

If you don't have Node 18+ installed, grab the LTS build from
[nodejs.org](https://nodejs.org) or use `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Git

```bash
git --version
```

### 3. Supabase project (free tier works)

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Pick a region close to your users (e.g. `ap-southeast-1` for the Gulf).
3. Once the project is ready, grab these values from **Project Settings →
   API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — keep
     it out of the browser bundle).

You'll also need to create the schema (tables + RLS policies). The authoritative
schema is maintained via Supabase migrations; if you're cloning a fresh
project, apply the migrations in the `supabase/` directory of the project (or
run them manually in the SQL editor).

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Suefyawn/TMFoodStuff.git
cd TMFoodStuff
```

### 2. Install dependencies

```bash
cd app
npm install
```

---

## Environment configuration

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials plus an admin password:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DASHBOARD_PASSWORD=pick-a-long-random-string
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

`MONGODB_URI` and `PAYLOAD_SECRET` can stay empty. When they're blank, the
optional Payload admin at `/admin` renders a friendly explainer page
pointing at `/dashboard` and the Payload REST endpoints under `/api/*`
return `503` instead of crashing.

---

## Running the development server

From the `app` directory:

```bash
npm run dev
```

Once it says `✓ Ready`, visit:

- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin dashboard (Supabase):** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
  - Log in with the `DASHBOARD_PASSWORD` from your `.env.local`.
- **Payload admin (optional):** [http://localhost:3000/admin](http://localhost:3000/admin)
  - Only functional if you also set `MONGODB_URI` and `PAYLOAD_SECRET`.

---

## Managing products and orders

All product, category, order and settings data lives in the Supabase
project. The easiest way to manage it is through the built-in dashboard:

1. Go to `/dashboard/login` and sign in with `DASHBOARD_PASSWORD`.
2. Use the sidebar to edit products, orders, categories, customers, promo
   codes and store settings.

Under the hood the dashboard talks to JSON APIs under `/api/dashboard/*`
that are authenticated via an opaque session cookie derived from
`DASHBOARD_PASSWORD`. The API routes all require the cookie — unauthenticated
requests return `401`.

---

## Common issues

**Port 3000 already in use**

```bash
npx kill-port 3000
npm run dev
```

**`Invalid scheme, expected connection string to start with "mongodb://"`**

You hit `/admin` without configuring Payload. Either set `MONGODB_URI` and
`PAYLOAD_SECRET`, or just use `/dashboard` — Payload is optional.

**Supabase reads return empty arrays**

Double-check that `SUPABASE_SERVICE_ROLE_KEY` is set on the server. The
storefront uses the anon key and relies on the `products`, `categories`
and `product_images` tables having public `SELECT` RLS policies; everything
else is locked down and must be fetched via the service role.

**Module not found errors**

```bash
rm -rf node_modules package-lock.json
npm install
```
