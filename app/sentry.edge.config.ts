import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE
      || process.env.VERCEL_GIT_COMMIT_SHA
      || undefined,
    tracesSampleRate: 0.1,
  })
}
