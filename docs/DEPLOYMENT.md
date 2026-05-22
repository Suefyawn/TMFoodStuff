# 🚀 Deployment Guide

This guide covers deploying TMFoodStuff to **Vercel** with a **Supabase**
backend.

---

## Step 1: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com). Pick a region
   close to the UAE (e.g. `ap-south-1`).
2. From **Project Settings → API**, note:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never
     ship it to the browser)
3. In the **SQL Editor**, run `supabase/schema.sql` to create all tables, RLS
   policies, indexes and functions. For an existing project, apply each file in
   `supabase/migrations/` instead.
4. Create the product image storage bucket (the `add_product_image_urls.sql`
   migration includes the bucket + policies).

### Dashboard access (Supabase Auth)

The `/dashboard` admin uses Supabase Auth — one login per staff member.

1. **Authentication → Providers → Email**: turn **off** "Allow new users to
   sign up" (only you create accounts).
2. **Authentication → Users → Add user**: create each staff account.
3. Add every staff email to the `admin_users` table — only emails listed there
   can reach `/dashboard`.

---

## Step 2: Set Up Vercel

1. At [vercel.com](https://vercel.com), **Add New Project** → import
   `Suefyawn/TMFoodStuff`.
2. Configure build settings:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | Next.js |
   | Root Directory | `app` |
   | Build Command | `npm run build` |
   | Install Command | `npm install` |

---

## Step 3: Environment Variables

In **Settings → Environment Variables**, add the following (see
`app/.env.example` for the full annotated list):

**Required**

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, e.g. `https://tmfoodstuff.ae` |

**Optional** — each integration is skipped gracefully if its keys are unset:

- **Email (Resend):** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`
- **Error tracking (Sentry):** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- **Analytics (PostHog):** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **Payments (Stripe):** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Store / delivery:** `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_STORE_EMAIL`,
  `NEXT_PUBLIC_PROMO_CODE`, `NEXT_PUBLIC_LAUNCH_FREE_DELIVERY`,
  `NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD`, `NEXT_PUBLIC_DELIVERY_FEE`

Click **Deploy** to trigger the first build.

---

## Step 4: Stripe (online card payments)

Cash on delivery works with no setup. To enable the "Pay Online" option:

1. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test keys
   first) to Vercel.
2. After the first deploy, in the **Stripe dashboard → Developers → Webhooks**,
   add an endpoint: `https://<your-domain>/api/stripe/webhook`, subscribed to
   the **`checkout.session.completed`** event.
3. Copy the endpoint's **signing secret** into `STRIPE_WEBHOOK_SECRET` and
   redeploy.

The card option only appears at checkout once `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
is set.

---

## Step 5: Custom Domain

1. Project → **Settings → Domains → Add Domain** (e.g. `tmfoodstuff.ae`).
2. Add the DNS records Vercel shows:
   - Apex domain: **A record** `@` → `76.76.21.21`
   - `www` subdomain: **CNAME** `www` → `cname.vercel-dns.com`
3. Update `NEXT_PUBLIC_SITE_URL` to the live domain and redeploy.

---

## Step 6: Post-Deploy Checklist

- [ ] Storefront loads at the live domain
- [ ] `/dashboard` redirects to login; signing in with a Supabase Auth account
      in `admin_users` reaches the dashboard
- [ ] Place a test order (cash on delivery) — order row created, emails sent
- [ ] If Stripe is enabled: place a test card order and confirm the webhook
      flips the order to `paid`
- [ ] `/sitemap.xml` and `/robots.txt` resolve
- [ ] Supabase advisors show no ERROR-level findings

---

## Redeployments

Every push to `main` triggers a Vercel deployment automatically; other branches
get their own preview URL. Environment-variable changes require a redeploy to
take effect.

## Monitoring

- **Vercel Analytics** — Core Web Vitals (enable in project settings)
- **Sentry** — runtime error tracking (when the DSN is set)
- **PostHog** — product analytics and conversion funnels (when the key is set)
- **Supabase** — query performance and the security **Advisors** page
