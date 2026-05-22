import { describe, it, expect } from 'vitest'
import { computeOrderTotals, subtotalOf, round2 } from './pricing'

describe('round2', () => {
  it('keeps clean values unchanged', () => {
    expect(round2(10)).toBe(10)
    expect(round2(1.2)).toBe(1.2)
  })
  it('tames binary floating-point drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})

describe('subtotalOf', () => {
  it('sums price * quantity across line items', () => {
    expect(
      subtotalOf([
        { price_aed: 9.5, quantity: 2 },
        { price_aed: 4.25, quantity: 3 },
      ]),
    ).toBe(31.75)
  })
  it('is 0 for an empty cart', () => {
    expect(subtotalOf([])).toBe(0)
  })
})

describe('computeOrderTotals', () => {
  it('applies 5% VAT with free delivery and no promo', () => {
    expect(
      computeOrderTotals({
        lineItems: [{ price_aed: 100, quantity: 1 }],
        vatRatePercent: 5,
        deliveryFee: 0,
        promoDiscountPercent: 0,
      }),
    ).toEqual({ subtotal: 100, vat: 5, deliveryFee: 0, promoDiscount: 0, total: 105 })
  })

  it('adds the delivery fee to the total', () => {
    const r = computeOrderTotals({
      lineItems: [{ price_aed: 50, quantity: 2 }],
      vatRatePercent: 5,
      deliveryFee: 15,
      promoDiscountPercent: 0,
    })
    expect(r.subtotal).toBe(100)
    expect(r.deliveryFee).toBe(15)
    expect(r.total).toBe(120)
  })

  it('subtracts a percentage promo discount', () => {
    const r = computeOrderTotals({
      lineItems: [{ price_aed: 200, quantity: 1 }],
      vatRatePercent: 5,
      deliveryFee: 0,
      promoDiscountPercent: 10,
    })
    expect(r.promoDiscount).toBe(20)
    expect(r.total).toBe(190) // 200 + 10 VAT - 20 promo
  })

  it('leaves only VAT payable under a 100% promo', () => {
    const r = computeOrderTotals({
      lineItems: [{ price_aed: 10, quantity: 1 }],
      vatRatePercent: 5,
      deliveryFee: 0,
      promoDiscountPercent: 100,
    })
    expect(r.promoDiscount).toBe(10)
    expect(r.total).toBe(0.5) // subtotal fully discounted, VAT still applies
  })

  it('clamps the total at 0 for an oversized discount', () => {
    const r = computeOrderTotals({
      lineItems: [{ price_aed: 10, quantity: 1 }],
      vatRatePercent: 5,
      deliveryFee: 0,
      promoDiscountPercent: 200,
    })
    expect(r.total).toBe(0)
  })

  it('rounds money values to 2 decimals', () => {
    const r = computeOrderTotals({
      lineItems: [{ price_aed: 3.33, quantity: 3 }],
      vatRatePercent: 5,
      deliveryFee: 0,
      promoDiscountPercent: 0,
    })
    expect(r.subtotal).toBe(9.99)
    expect(r.vat).toBe(0.5)
    expect(r.total).toBe(10.49)
  })
})
