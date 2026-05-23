# Session Handoff — TMFoodStuff

Last updated: 2026-05-23. Read this at the start of the next session.

## Where we are

The user (`jetnine.inc@gmail.com`) is bringing a UAE food-delivery storefront to launch. Codebase is Next.js 15 (App Router) + Supabase + Stripe + Resend + Twilio, deployed on Vercel.

**Branch state:** `claude/inspiring-bell-ChYTy` has 5 commits the user said they've merged into `main`. Confirm with `git log main` before assuming. The commits, oldest to newest:

| Commit | What it shipped |
|---|---|
| `7dc8dc8` | gitleaks secret-scan CI job (`.github/workflows/secret-scan.yml`) |
| `8266eac` | Bilingual EN/AR customer emails (locale captured at checkout, threaded through `fulfillOrder`) |
| `d20f739` | Stripe Checkout online card payments (AED, `checkout.session.completed` webhook fulfils via shared `fulfillOrder`) |
| `fd7a62d` | Docs refresh (`docs/DEPLOYMENT.md`), ESLint config, localized stock form |
| `85dc840` | Twilio SMS + WhatsApp notifications (order confirmation, delivery status, admin alert) |

## What the user is doing themselves (do NOT redo)

1. **Rotate the leaked credential.** Gitleaks flagged a secret in history. Hasn't been confirmed rotated — ask before doing anything live with that key.
2. **Run the Supabase schema/migrations** against their project (this is what they need Supabase MCP for next session).
3. **Set env vars in Vercel** for Supabase, Stripe, Twilio, Resend.
4. **Create the Supabase auth user** for `jetnine.inc@gmail.com` and pick a password.

## Decisions locked in (don't relitigate)

- **Emails:** bilingual EN/AR, `Locale` derived from the cookie at checkout, stored on `orders.locale`, used by `fulfillOrder` and status updates. Code in `app/src/lib/email.ts`.
- **Twilio:** **both** SMS and WhatsApp, for three events only: customer order confirmation, customer delivery status (out_for_delivery, delivered), admin new-order alert. Back-in-stock stays email-only. Code in `app/src/lib/notify.ts`. Freeform `body` for both channels — works for SMS in production and for WhatsApp sandbox/sessions; **production WhatsApp business-initiated will need Meta-approved templates** (documented, not built — would need user's templates to test).
- **Stripe:** AED, Checkout Sessions, fulfilment in webhook (`/api/stripe/webhook`) via the shared `fulfillOrder` helper so COD and card take the same path. Pricing is computed server-side from product rows — never trust the client cart.
- **Admin auth:** two-layer — Supabase Auth handles the password; `admin_users` table is the allowlist. `app/src/lib/admin-auth.ts`. The schema seeds `jetnine.inc@gmail.com` into `admin_users` (`supabase/schema.sql:178`).
- **`ADMIN_EMAIL` env var ≠ login.** It's only the recipient of new-order alert emails.
- **Graceful no-op pattern:** every external integration (Stripe, Resend, Twilio) silently skips when its env vars are unset. The user can bring services online one at a time.

## What needs Supabase MCP next session

This is the main reason for the handoff — the previous session didn't have project-level Supabase access.

1. **Confirm/run the schema.** Compare `supabase/schema.sql` and `supabase/migrations/*.sql` against the live project (`list_tables`, `list_migrations`). The expected tables: `products`, `categories`, `orders`, `order_items`, `customers`, `settings`, `admin_users`, `low_stock_subscriptions`. Apply anything missing via `apply_migration`.
2. **Verify `orders` columns** match what the code reads/writes. Critical fields the new code touches:
   - `locale` (text, `'en'`|`'ar'`) — added by `8266eac`. Used by `fulfillOrder` and status emails/SMS.
   - `customer_phone` (text, required) — used by Twilio notify (`notify.ts`) and selected by `app/src/app/api/dashboard/orders/route.ts`.
   - `customer_email`, `customer_name`, `delivery_slot`, `total`, `total_aed`, `order_number`, `status`.
3. **Confirm `admin_users` is seeded** with `jetnine.inc@gmail.com`. If not: `insert into admin_users (email) values ('jetnine.inc@gmail.com')`.
4. **Run `get_advisors`** for security and performance — flag anything actionable for the user.
5. **`get_project_url` + `get_publishable_keys`** to give the user the exact values to drop into Vercel env vars.
6. **Auth user check.** No direct API to list auth users via MCP, so just remind the user to create the auth user in the Supabase dashboard for `jetnine.inc@gmail.com` if not done. Login path is `/dashboard/login`.

## Remaining setup punch list (user is driving)

In priority order:

1. Rotate the leaked credential (security, blocking).
2. Supabase: env vars + schema applied + auth user created. **← next-session MCP work**
3. Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook → `STRIPE_WEBHOOK_SECRET`.
4. Twilio: `TWILIO_ACCOUNT_SID/AUTH_TOKEN/SMS_FROM` (SMS works immediately); `TWILIO_WHATSAPP_FROM` (sandbox works; production needs Meta templates).
5. Resend: `RESEND_API_KEY` + verified sending domain.
6. Deploy to Vercel + smoke test: one COD order (email + SMS land), flip status to `out_for_delivery` and `delivered` (status notifications).

## How to test things in the next session

- `cd app && npm test` — 10 unit tests, ~1s.
- `cd app && npx next lint` — should be clean except 2 admin `<img>` warnings (intentional).
- `cd app && npm run build` — full Next build, ~30s.
- Local dev: `cd app && npm run dev` — needs env vars to be useful.

## Files most likely to come up

| File | Why |
|---|---|
| `app/src/lib/order-fulfillment.ts` | Shared fulfilment for COD + Stripe; fires emails + Twilio |
| `app/src/lib/email.ts` | Bilingual templates, Resend client, `toLocale()` helper |
| `app/src/lib/notify.ts` | Twilio SMS + WhatsApp |
| `app/src/lib/admin-auth.ts` | Two-layer admin auth |
| `app/src/app/api/dashboard/orders/route.ts` | Admin status updates → emails + notifications |
| `app/src/app/api/stripe/webhook/route.ts` | Card payment fulfilment |
| `app/.env.example` | Source of truth for required env vars |
| `supabase/schema.sql` | Full schema + seed for `admin_users` |
| `docs/DEPLOYMENT.md` | Up-to-date env var matrix |

## Don't

- Don't create a PR unless the user asks.
- Don't push to anything other than the user's designated branch.
- Don't add a `contentSid`/template-based WhatsApp path until the user has approved templates in Twilio — it's untestable without them and current freeform code is the right placeholder.
- Don't change the admin auth model — two layers (Supabase Auth + `admin_users` allowlist) is intentional.
- Don't refactor or "tidy" working code drive-by.
