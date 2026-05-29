# Third-party integrations — wiring & verification

How to turn each integration on in production and prove it works. Every
integration is **optional and no-ops when its env vars are absent**, so you can
enable them one at a time. Set the variables in **Vercel → tm-food-stuff →
Settings → Environment Variables (Production)**, then redeploy.

> This file intentionally contains **no live keys** — the repo is public and CI
> runs gitleaks. Real values for the client-safe keys (Sentry DSN, PostHog key)
> are shared out-of-band; secrets (Stripe, Twilio, Resend, auth tokens) are
> generated in each provider's dashboard.

| Integration | Purpose | Status | Blocked on |
|---|---|---|---|
| Stripe | Online card payment | ✅ wired & verified (sandbox) | live keys for go-live |
| Sentry | Error tracking | project created — needs env + redeploy | you (paste env) |
| PostHog | Product analytics | provider in app — needs env + redeploy | you (paste env) |
| Twilio | Order SMS / WhatsApp | code ready (`src/lib/notify.ts`) | you (credentials) |
| Resend | Transactional email + inbox | code ready (`src/lib/email.ts`) | you (API key + DNS) |

---

## Sentry — error tracking

Reads `NEXT_PUBLIC_SENTRY_DSN` (enables the SDK on client/server/edge **and** the
build-time `withSentryConfig` wrap). Org/project drive source-map upload.

```
NEXT_PUBLIC_SENTRY_DSN=https://<public-key>@o<org>.ingest.de.sentry.io/<project-id>
SENTRY_ORG=tm-food-stuff
SENTRY_PROJECT=tmfoodstuff
SENTRY_AUTH_TOKEN=               # optional: Sentry → Settings → Auth Tokens.
                                 # Needed only for readable (un-minified) stack
                                 # traces; errors are captured without it.
```

The DSN is a **public** value (it already ships in the browser bundle). Project
`tmfoodstuff` already exists under org `tm-food-stuff` (EU / de.sentry.io region).

**Verify:** after redeploy, throw a test error (e.g. hit a route that calls
`logError`) and confirm it appears in the Sentry project. `NEXT_PUBLIC_SENTRY_RELEASE`
falls back to `VERCEL_GIT_COMMIT_SHA`, so deploys are auto-tagged.

## PostHog — product analytics

Reads `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` (`src/components/PostHogProvider.tsx`).
Both are client-safe.

```
NEXT_PUBLIC_POSTHOG_KEY=phc_<project-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # use eu.i.posthog.com if your project is EU
```

Confirm the host matches the region shown in your PostHog project's install
snippet. **Verify:** after redeploy, load the storefront and check the project's
`ingested_event` flips to true / a `$pageview` lands in Activity.

## Stripe — card payments  ✅ done

Already configured in Vercel and verified against the sandbox (webhook
signature verification active; Checkout Session creation confirmed). For go-live,
swap the test keys for **live** keys and add a **live-mode** webhook endpoint:

```
STRIPE_SECRET_KEY=sk_live_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…    # from the live webhook endpoint
```

Webhook endpoint: `https://tmfoodstuff.ae/api/stripe/webhook`, events
`checkout.session.completed` (+ `charge.refunded`). Enable the **Customer Portal**
(Settings → Billing → Customer portal) before go-live.

## Twilio — SMS + WhatsApp

`src/lib/notify.ts`. Each channel no-ops until its `*_FROM` is set, so SMS and
WhatsApp can be enabled independently.

```
TWILIO_ACCOUNT_SID=AC…
TWILIO_AUTH_TOKEN=…
TWILIO_SMS_FROM=+9715…           # E.164; UAE delivery needs a registered Sender ID
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # sandbox sender, or your WA number
TWILIO_ADMIN_PHONE=+9715…        # new-order alert recipient; blank to skip
```

⚠️ Production **business-initiated WhatsApp** requires Meta-approved Content
templates. The freeform message bodies here work for SMS and for WhatsApp
sandbox / 24-hour customer-care sessions. Sandbox testers must first join via
the join code.

**Verify:** place a COD test order with a real phone → fires
`notifyOrderConfirmation` + `notifyAdminNewOrder`. Check Vercel runtime logs for
`[Twilio:…] send failed` lines (none = success) and confirm receipt on the phone.

## Resend — transactional email + support inbox

`src/lib/email.ts` (outbound) and `src/app/api/inbound/email/route.ts` (inbound).

```
RESEND_API_KEY=re_…
RESEND_FROM_EMAIL=orders@tmfoodstuff.ae
ADMIN_EMAIL=orders@tmfoodstuff.ae        # "new order" admin email recipient
RESEND_WEBHOOK_SECRET=whsec_…            # only for the /dashboard/inbox inbound feature
```

Dashboard + DNS steps:
1. **Verify the domain** `tmfoodstuff.ae` in Resend → add the DKIM + SPF records
   it generates to your DNS.
2. *(Inbound, optional)* Webhooks → add endpoint
   `https://tmfoodstuff.ae/api/inbound/email`, event `email.inbound`, copy the
   signing secret into `RESEND_WEBHOOK_SECRET`, and MX-route `support@` to Resend.
   Without the secret the endpoint accepts unsigned posts (logs a warning) — fine
   for smoke testing, not for production.

**Verify:** place a test order → confirmation email arrives; the admin alert
lands at `ADMIN_EMAIL`.
