export const VAT_RATE = 0.05
export const FREE_DELIVERY_THRESHOLD = 150
export const DELIVERY_FEE = 10

export function formatAED(amount: number): string {
  return `AED ${amount.toFixed(2)}`
}

export function calculateVAT(subtotal: number): number {
  return parseFloat((subtotal * VAT_RATE).toFixed(2))
}

export function calculateDeliveryFee(subtotal: number): number {
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
