import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount)
}

export function calculateVAT(amount: number): number {
  return amount * 0.05
}

export function formatWithVAT(amount: number): { subtotal: string; vat: string; total: string } {
  const vat = calculateVAT(amount)
  return {
    subtotal: formatAED(amount),
    vat: formatAED(vat),
    total: formatAED(amount + vat),
  }
}
