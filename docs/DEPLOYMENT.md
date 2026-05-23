# Deployment guide

TMFoodStuff is a Next.js 15 (App Router) storefront backed by Supabase
(Postgres + Auth + Storage), with optional Stripe, Twilio, Resend, Sentry, and
PostHog integrations. Vercel is the recommended host. This guide walks through
the live setup end to end.

Every external service is **optional** — when its env vars are blank the
corresponding feature silently no-ops. You can bring them online one at a time.

---

## 1. Supabase

### 1.1 Project

1. Create a project at https://supabase.com (free tier is fine to launch).
2. Pick a region close to your users — `ap-southeast-1` for the UAE.
3. Note the project ref (e.g. `eoecnybevhxfdyzlodua`).

### 1.2 Schema

Apply the migrations in `supabase/migrations/` in order — either with the
Supabase CLI or through the dashboard SQL editor:

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

### 1.3 Admin allowlist

The dashboard uses two layers: **Supabase Auth** holds the password, and the
`admin_users` table holds the allowlist. Add yourself to both:

1. Authentication → Providers → Email → turn off public sign-ups.
2. Authentication → Users → Add user → enter your email and a password.
3. SQL editor:
   ```sql
   insert into public.admin_users (email, role, is_active)
   values ('you@example.com', 'admin', true);
   ```

Sign in at `/dashboard/login`.

### 1.4 Storage

A `product-images` bucket is needed for product photo uploads. Create it
**Public** in Storage → Buckets if you want product images served from the
Supabase CDN.

---

## 2. Required env vars

Copy `app/.env.example` and fill in the values. Required for a minimal
production launch:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → publishable key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (server-only, keep secret) |
| `NEXT_PUBLIC_SITE_URL` | The production URL, e.g. `https://tmfoodstuff.ae` |

Everything else is optional. Add only what you intend to use.

---

## 3. Optional integrations

### 3.1 Stripe (online card payments)

1. Create a Stripe account; switch to **Test mode** for the first run-through.
2. Grab the test keys from https://dashboard.stripe.com/test/apikeys.
3. Set:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Add the webhook endpoint after the first deploy:
   - Dashboard → Developers → Webhooks → **Add endpoint**
   - URL: `https://YOUR_DOMAIN/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Reveal the signing secret and set `STRIPE_WEBHOOK_SECRET`.
5. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.
6. Switch to live keys once you've verified an end-to-end test order.

Card payment falls back to a "service unavailable" message when these keys are
missing — Cash on Delivery keeps working regardless.

### 3.2 Twilio (SMS + WhatsApp)

The same body is sent over both channels for order confirmation, the
out-for-delivery / delivered status updates, and the admin new-order alert.

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_SMS_FROM=+12025550100      # purchased SMS-capable number
TWILIO_WHATSAPP_FROM=+14155238886 # sandbox: whatsapp:+14155238886
TWILIO_ADMIN_PHONE=+9715XXXXXXXX  # optional, for the new-order alert
```

Notes:
- UAE SMS delivery may need an approved **Alphanumeric Sender ID** in Twilio
  Console depending on routing.
- The WhatsApp sandbox works immediately once each tester sends the join code.
- For **production WhatsApp business-initiated** messages you must send via
  Twilio Content Templates (Meta-approved templates). The current code uses
  freeform `body`, which works for the sandbox and for replies within a 24-hour
  customer-care session, but not for cold business-initiated WhatsApp.

### 3.3 Resend (transactional email)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@tmfoodstuff.ae
ADMIN_EMAIL=orders@tmfoodstuff.ae
```

Verify your sending domain in https://resend.com/domains (add the DKIM/SPF
records to your DNS) before going live. Without verification, emails to most
inboxes will be rejected.

`ADMIN_EMAIL` is **only** the recipient of the new-order alert. It does not
grant dashboard access — that's controlled by `admin_users`.

### 3.4 Sentry / PostHog

Both pick up their respective env vars and stay dormant otherwise. See
`app/.env.example` for the variable names.

---

## 4. Vercel

1. https://vercel.com → **Add New Project** → Import the GitHub repo.
2. **Root Directory**: `app`.
3. Framework preset auto-detects Next.js.
4. Project Settings → **Environment Variables** → paste every key from your
   `.env.example` into Production (and Preview if you want previews to work).
5. Deploy.

After the first deploy, add the Stripe webhook (3.1) using the live URL.

### Custom domain

Settings → Domains → add `tmfoodstuff.ae`. Vercel shows the exact A record
(`76.76.21.21`) or CNAME (`cname.vercel-dns.com`) to add at your registrar.
Update `NEXT_PUBLIC_SITE_URL` and redeploy once DNS is live.

---

## 5. Smoke test

After deploying, walk through one full flow per payment method:

- [ ] Sign in at `/dashboard/login`.
- [ ] Browse `/shop`, add an item, complete `/checkout` with **Cash on Delivery**.
- [ ] Confirm the order row appears in Supabase (`select * from orders`).
- [ ] Confirm the confirmation email lands (if Resend is set).
- [ ] Confirm the confirmation SMS / WhatsApp lands (if Twilio is set).
- [ ] In `/dashboard/orders`, flip status to `out_for_delivery` then `delivered`
      and confirm the status emails / SMS go out.
- [ ] Repeat the order with **Pay Online**, use Stripe test card
      `4242 4242 4242 4242`, confirm the webhook marks `payment_status=paid`
      and fulfilment fires.

---

## 6. Ongoing

- Every push to `main` redeploys via Vercel.
- The `Secret scan` workflow runs gitleaks on every push and PR.
- The `CI` workflow runs `npm test` and `npm run build` on every push and PR.
- Periodically run `mcp__supabase__get_advisors` (or Database → Advisors in the
  dashboard) to catch new RLS / performance issues.
