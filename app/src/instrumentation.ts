import * as Sentry from '@sentry/nextjs'

// Next.js instrumentation hook. @sentry/nextjs v8+ requires Sentry.init() to
// run from here — without this file the server and edge SDKs never initialize,
// so only browser errors are captured and every server-side logError() /
// captureException() is silently dropped. The init code lives in the
// sentry.server.config / sentry.edge.config files at the project root (one
// level up from this src/ file).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Capture errors thrown while rendering nested React Server Components (Next 15).
export const onRequestError = Sentry.captureRequestError
