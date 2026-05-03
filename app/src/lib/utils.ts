export const VAT_RATE = 0.05

// Controlled via env vars — set NEXT_PUBLIC_LAUNCH_FREE_DELIVERY=false to end launch period
export const LAUNCH_FREE_DELIVERY = process.env.NEXT_PUBLIC_LAUNCH_FREE_DELIVERY !== 'false'
export const FREE_DELIVERY_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD || '150')
export const DELIVERY_FEE = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE || '15')

export function formatAED(amount: number): string {
  return `AED ${amount.toFixed(2)}`
}

export function calculateVAT(subtotal: number): number {
  return parseFloat((subtotal * VAT_RATE).toFixed(2))
}

export function calculateDeliveryFee(subtotal: number): number {
  if (LAUNCH_FREE_DELIVERY) return 0
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

export function calculateTotal(subtotal: number) {
  const vat = calculateVAT(subtotal)
  const deliveryFee = calculateDeliveryFee(subtotal)
  const total = subtotal + vat + deliveryFee
  return { subtotal, vat, deliveryFee, total }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
