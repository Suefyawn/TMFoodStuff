// Stripe SDK wrapper. Lazily constructed so a missing STRIPE_SECRET_KEY simply
// disables the card payment path instead of failing the build.
import Stripe from 'stripe'

let cached: Stripe | null | undefined

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    cached = null
    return null
  }
  cached = new Stripe(key)
  return cached
}

export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}
