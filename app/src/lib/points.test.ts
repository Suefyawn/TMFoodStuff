import { describe, it, expect } from 'vitest'
import {
  POINTS_PER_AED_EARN,
  POINTS_PER_AED_REDEEM,
  MIN_REDEEM_POINTS,
  pointsEarnedFor,
  aedValueOfPoints,
  resolveRedemption,
} from './points'

describe('pointsEarnedFor', () => {
  it('rounds AED subtotal down to whole points', () => {
    expect(pointsEarnedFor(0)).toBe(0)
    expect(pointsEarnedFor(9.5)).toBe(9)
    expect(pointsEarnedFor(100)).toBe(100)
  })
  it('uses the configured earn rate', () => {
    expect(pointsEarnedFor(1)).toBe(POINTS_PER_AED_EARN)
  })
  it('never returns a negative count', () => {
    expect(pointsEarnedFor(-5)).toBe(0)
  })
})

describe('aedValueOfPoints', () => {
  it('returns 0 below the minimum redemption threshold', () => {
    expect(aedValueOfPoints(MIN_REDEEM_POINTS - 1)).toBe(0)
  })
  it('floors at the redeem ratio', () => {
    // 100 points / 20 = 5 AED
    expect(aedValueOfPoints(100)).toBe(5)
    // 219 points / 20 = 10 AED (not 10.95)
    expect(aedValueOfPoints(219)).toBe(10)
  })
})

describe('resolveRedemption', () => {
  it('returns nothing when no points are requested', () => {
    const r = resolveRedemption({ pointsRequested: 0, balance: 500, subtotalAed: 100 })
    expect(r.points).toBe(0)
    expect(r.aed).toBe(0)
  })
  it('rejects requests below the minimum', () => {
    const r = resolveRedemption({ pointsRequested: 50, balance: 500, subtotalAed: 100 })
    expect(r.aed).toBe(0)
    expect(r.reason).toContain('Minimum')
  })
  it('caps the request to the available balance', () => {
    const r = resolveRedemption({ pointsRequested: 1000, balance: 200, subtotalAed: 100 })
    expect(r.points).toBe(200)
    expect(r.aed).toBe(10)
  })
  it('caps the discount at the cart subtotal', () => {
    const r = resolveRedemption({ pointsRequested: 1000, balance: 1000, subtotalAed: 12 })
    // Discount must not exceed 12 AED. 12 AED = 240 points actually used.
    expect(r.aed).toBe(12)
    expect(r.points).toBe(240)
  })
  it('refuses when balance after min still cannot redeem any AED', () => {
    // 99 points wanted, balance 99 — below minimum, no redemption.
    const r = resolveRedemption({ pointsRequested: 99, balance: 99, subtotalAed: 100 })
    expect(r.aed).toBe(0)
  })
})
