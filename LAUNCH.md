# Launch checklist — TM FoodStuff

Operator config tasks. None of these are code — they're the dashboard /
DNS / Stripe / Resend / Supabase configuration that turns the deployed
codebase into a live business.

Tick each off, top-to-bottom. Anything blocked, ask.

## 1. Database — already done in dev, verify on prod

- [ ] All migrations applied to the production Supabase project
- [ ] Service-role key in the Vercel env vars (server-only)
- [ ] Publishable key in the Vercel env vars (client-safe)
- [ ] RLS policies active on `customer_carts`, `customer_referrals`,
      `customer_review_votes`, `subscriptions`, `support_threads`,
      `support_messages`, `broadcasts`, `delivery_slots`, `push_subscriptions`,
      `order_refunds`, `order_status_history`, `search_logs`, `product_reviews`

## 2. Stripe

- [ ] Live mode API keys in env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Webhook endpoint added in Stripe Dashboard → Webhooks pointing to
      `https://yourdomain/api/stripe/webhook`, listening to
      `checkout.session.completed`, `charge.refunded`. Copy the signing
      secret into env.
- [ ] **Customer Portal**: Stripe Dashboard → Settings → Billing →
      Customer portal → enable, set return URL to your domain, allow
      "Update payment method", save. The portal won't open until this is
      enabled.

## 3. Resend

- [ ] Live API key in env (`RESEND_API_KEY`)
- [ ] Domain verified in Resend (`tmfoodstuff.ae` or whatever you ship from)
- [ ] DKIM + SPF DNS records added per Resend's instructions
- [ ] `FROM_EMAIL` env var set (e.g. `orders@tmfoodstuff.ae`)
- [ ] **Inbound webhook** (for `/dashboard/inbox` to actually work):
      Resend Dashboard → Webhooks → add endpoint
      `https://yourdomain/api/inbound/email`, event = `email.inbound`,
      copy the signing secret into `RESEND_WEBHOOK_SECRET`. Without the
      secret the endpoint logs a warning and accepts unsigned — safe for
      smoke testing, not for production.
- [ ] DNS for the inbound address — either MX-route `support@tmfoodstuff.ae`
      to Resend, or set a forwarding rule on your Zoho/Workspace mailbox
      that delivers a copy to a Resend-managed address.

## 4. Twilio (SMS)

- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
      in env
- [ ] Sender verified for UAE delivery (carrier compliance)

## 5. Supabase Auth

- [ ] **Email confirmation** turned on: Supabase Dashboard → Authentication
      → Providers → Email → "Confirm email" toggle. The storefront
      already handles the "check your inbox" UX; this is just the
      backend toggle.
- [ ] Site URL set to production domain in Auth → URL Configuration
- [ ] Email templates customised (optional but recommended for branding)

## 6. PWA push notifications

- [ ] First time a customer opts in on production, VAPID keys
      auto-generate and persist into the `settings` table. Verify with
      `select key from settings where key like 'vapid_%'` — you should
      see three rows after the first subscription.
- [ ] Apple HIG note: iOS Safari only fires `Notification.requestPermission`
      from a user gesture and only on PWAs installed via "Add to Home
      Screen". The prompt won't appear inline like Android.

## 7. Cron jobs

These run automatically via `vercel.json` once deployed. Verify in
Vercel → Project → Cron Jobs that they're listed and toggled on:

- [ ] `cleanup-abandoned-orders` (daily) — also runs cart abandonment sweep
- [ ] `expire-points` (daily) — also runs subscription dispatcher

`CRON_SECRET` env var must be set so manual triggers work from
local/staging.

## 8. Dashboard configuration (in-app, after deploy)

Sign in to `/dashboard` as the first admin and walk through these:

- [ ] **Settings** (`/dashboard/settings`):
  - Store name + WhatsApp number
  - Delivery fee + VAT rate + min order amount
  - VAT TRN + company name + address + invoice footer note
- [ ] **Delivery slots** (`/dashboard/delivery-slots`): adjust the seeded
      morning/afternoon/evening with your real time labels (EN+AR),
      same-day cutoff hours, daily capacity, and day-of-week mask
      (e.g. no Friday morning if you don't deliver then)
- [ ] **Team** (`/dashboard/team`): invite every team member by email
      with the right role. Drivers should get role=driver so they're
      scoped to the deliveries queue.
- [ ] **Products**: import or create your real catalog. Set
      `low_stock_threshold` per product (the default of 5 is fine for
      most; high-velocity items like bananas might want 20+). Mark
      bundles + add their composition.
- [ ] **Categories**: confirm display order + parent relationships
- [ ] **Promo codes**: WELCOMEBACK10 is seeded for cart recovery. Add
      anything else (FIRST10, ORGANIC15, etc.)
- [ ] **Broadcasts**: nothing to configure here, just know it exists for
      launch announcements

## 9. End-to-end smoke test

Place a real test order on production:

- [ ] As a guest, add 2-3 items, check out as COD
- [ ] Confirm: order email received, WhatsApp link works, order appears
      in `/dashboard/orders`
- [ ] Sign up as a real customer with the test email, place a second
      order paying by card
- [ ] Verify: Stripe payment captured, order status moves to confirmed,
      points credited after marking delivered
- [ ] As admin, walk the picker → driver → delivered flow:
  - Open `/dashboard/pick`, tick items, mark packed (→ processing)
  - Open `/dashboard/deliveries`, assign to a driver (or have the
    driver claim it), start delivery (→ out_for_delivery),
    mark delivered
- [ ] Print packing slips from `/dashboard/packing-slips`
- [ ] Issue a partial refund to test card flow

## 10. Live observability

- [ ] PostHog or your analytics account wired into env
- [ ] Sentry DSN wired (already-installed sentry MCP integration)
- [ ] Set up at least one team member to receive the daily digest email
      (handled automatically by `expire-points` cron — make sure
      `ADMIN_EMAIL` env var points to a monitored inbox)

## 11. Pre-launch comms

- [ ] Update `LaunchBanner` text or remove component
- [ ] Set `free_delivery` setting to whatever's actually true at launch
- [ ] Pin top 8-10 featured products (mark `is_featured=true`)

---

Once every box above is ticked, the site is ready for paying customers.
Anything broken in that walk-through, dig in and fix before you publish
the URL anywhere.
