import { describe, it, expect } from 'vitest'
import { isValidEmail, isValidUAEPhone, normaliseUAEPhone } from './validators'

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('user.name+tag@sub.example.com')).toBe(true)
  })
  it('rejects malformed input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('no-at-sign')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('@b.co')).toBe(false)
    expect(isValidEmail('a b@c.co')).toBe(false)
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(123)).toBe(false)
  })
})

describe('isValidUAEPhone', () => {
  it('accepts common UAE mobile formats', () => {
    expect(isValidUAEPhone('+971501234567')).toBe(true)
    expect(isValidUAEPhone('971501234567')).toBe(true)
    expect(isValidUAEPhone('0501234567')).toBe(true)
    expect(isValidUAEPhone('501234567')).toBe(true)
    expect(isValidUAEPhone('+971 50 123 4567')).toBe(true)
    expect(isValidUAEPhone('+971-50-123-4567')).toBe(true)
  })
  it('rejects junk', () => {
    expect(isValidUAEPhone('')).toBe(false)
    expect(isValidUAEPhone('abc')).toBe(false)
    expect(isValidUAEPhone('123')).toBe(false)
    expect(isValidUAEPhone(undefined)).toBe(false)
  })
})

describe('normaliseUAEPhone', () => {
  it('converts common entry formats to +971…', () => {
    expect(normaliseUAEPhone('0501234567')).toBe('+971501234567')
    expect(normaliseUAEPhone('501234567')).toBe('+971501234567')
    expect(normaliseUAEPhone('971501234567')).toBe('+971501234567')
    expect(normaliseUAEPhone('+971 50 123 4567')).toBe('+971501234567')
  })
  it('leaves non-UAE-shaped numbers alone', () => {
    expect(normaliseUAEPhone('+14155551234')).toBe('+14155551234')
  })
})
