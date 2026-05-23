import { describe, it, expect } from 'vitest'
import { toLocale } from './locale'

describe('toLocale', () => {
  it('returns "ar" only for the exact "ar" string', () => {
    expect(toLocale('ar')).toBe('ar')
  })

  it('falls back to "en" for any other value', () => {
    expect(toLocale('en')).toBe('en')
    expect(toLocale(undefined)).toBe('en')
    expect(toLocale(null)).toBe('en')
    expect(toLocale('AR')).toBe('en')
    expect(toLocale('fr')).toBe('en')
    expect(toLocale({})).toBe('en')
  })
})
