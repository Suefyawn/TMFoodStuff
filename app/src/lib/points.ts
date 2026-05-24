// Loyalty programme rules. Centralised here so the UI, checkout API, and
// admin status transitions all agree on the same numbers.

/** Earn 1 point per AED of *subtotal* (excludes VAT, delivery, promo, points). */
export const POINTS_PER_AED_EARN = 1

/** Redeem 20 points for 1 AED off. Minimum redemption 100 points (= AED 5). */
export const POINTS_PER_AED_REDEEM = 20
export const MIN_REDEEM_POINTS = 100

/** Earned points expire 12 months after they're credited. */
export const POINTS_EXPIRY_MONTHS = 12

export function pointsEarnedFor(subtotalAed: number): number {
  // Round DOWN — half-points feel arbitrary; a 9.5 AED order earns 9 points,
  // not 10.
  return Math.max(0, Math.floor(subtotalAed * POINTS_PER_AED_EARN))
}

export function aedValueOfPoints(points: number): number {
  if (points < MIN_REDEEM_POINTS) return 0
  return Math.floor(points / POINTS_PER_AED_REDEEM)
}

/**
 * Clamp + validate a redemption request given the customer's current
 * balance and the order subtotal. Returns the AED discount that should
 * actually apply (capped so the order can never end up below the VAT line)
 * and the integer point count to debit.
 */
export function resolveRedemption(input: {
  pointsRequested: number
  balance: number
  subtotalAed: number
}): { points: number; aed: number; reason?: string } {
  const wanted = Math.max(0, Math.floor(input.pointsRequested))
  if (wanted === 0) return { points: 0, aed: 0 }
  if (wanted < MIN_REDEEM_POINTS) {
    return { points: 0, aed: 0, reason: `Minimum redemption is ${MIN_REDEEM_POINTS} points.` }
  }
  const usable = Math.min(wanted, input.balance)
  if (usable < MIN_REDEEM_POINTS) {
    return { points: 0, aed: 0, reason: 'Not enough points to redeem.' }
  }
  // Round down to a whole AED so the discount value is clean.
  const aed = aedValueOfPoints(usable)
  if (aed <= 0) return { points: 0, aed: 0 }
  // Cap the discount at the cart subtotal so the order never goes negative.
  const cappedAed = Math.min(aed, Math.floor(input.subtotalAed))
  if (cappedAed <= 0) return { points: 0, aed: 0, reason: 'Cart subtotal is too low to redeem.' }
  // Convert the capped AED back to points so the ledger reflects what we
  // actually used.
  const usedPoints = cappedAed * POINTS_PER_AED_REDEEM
  return { points: usedPoints, aed: cappedAed }
}

export function pointsExpiryDate(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setMonth(d.getMonth() + POINTS_EXPIRY_MONTHS)
  return d
}
