import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Tag every event with the deploy SHA so a regression can be pinned
    // to a specific Vercel deployment. NEXT_PUBLIC_SENTRY_RELEASE wins if
    // set explicitly (e.g. for a hot-fix), otherwise fall back to the
    // commit SHA Vercel exposes at build time.
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE
      || process.env.VERCEL_GIT_COMMIT_SHA
      || undefined,
    tracesSampleRate: 0.1,
  })
}
