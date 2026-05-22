// Pure order-pricing math. The server always recomputes money values here from
// authoritative data (DB product prices, store settings, validated promo) —
// client-supplied amounts are never trusted. Kept dependency-free so it can be
// unit-tested in isolation (see pricing.test.ts).

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100

export interface PricingLineItem {
  price_aed: number
  quantity: number
}

export interface PricingInput {
  lineItems: PricingLineItem[]
  /** VAT rate as a percentage, e.g. 5 for 5%. */
  vatRatePercent: number
  /** Delivery fee already resolved (0 during the free-delivery launch). */
  deliveryFee: number
  /** Promo discount as a percentage of subtotal; 0 when no valid promo. */
  promoDiscountPercent: number
}

export interface PricingResult {
  subtotal: number
  vat: number
  deliveryFee: number
  promoDiscount: number
  total: number
}

export function subtotalOf(lineItems: PricingLineItem[]): number {
  return round2(lineItems.reduce((sum, i) => sum + i.price_aed * i.quantity, 0))
}

export function computeOrderTotals(input: PricingInput): PricingResult {
  const subtotal = subtotalOf(input.lineItems)
  const vat = round2(subtotal * (input.vatRatePercent / 100))
  const deliveryFee = round2(input.deliveryFee)
  const promoDiscount = round2(subtotal * (input.promoDiscountPercent / 100))
  const total = round2(Math.max(0, subtotal + vat + deliveryFee - promoDiscount))
  return { subtotal, vat, deliveryFee, promoDiscount, total }
}
