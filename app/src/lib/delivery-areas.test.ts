import { describe, it, expect } from 'vitest'
import {
  DEFAULT_DELIVERY_AREAS,
  isDeliverable,
  parseDeliveryAreas,
  validateDeliveryAreasInput,
} from './delivery-areas'

describe('parseDeliveryAreas', () => {
  it('trims, drops blanks and duplicates', () => {
    expect(parseDeliveryAreas(' Mirdif \n\nmirdif\r\nAl Qusais  ')).toEqual(['Mirdif', 'Al Qusais'])
  })
  it('falls back to the default when empty or missing', () => {
    expect(parseDeliveryAreas('')).toEqual(DEFAULT_DELIVERY_AREAS)
    expect(parseDeliveryAreas(null)).toEqual(DEFAULT_DELIVERY_AREAS)
    expect(parseDeliveryAreas('  \n ')).toEqual(DEFAULT_DELIVERY_AREAS)
  })
})

describe('isDeliverable', () => {
  const areas = DEFAULT_DELIVERY_AREAS
  it('accepts a listed Dubai area, ignoring case and spacing', () => {
    expect(isDeliverable('Dubai', 'Ras Al Khor', areas)).toBe(true)
    expect(isDeliverable(' dubai ', '  business   bay ', areas)).toBe(true)
    expect(isDeliverable('دبي', 'Mirdif', areas)).toBe(true)
  })
  it('rejects other emirates', () => {
    expect(isDeliverable('Sharjah', 'Ras Al Khor', areas)).toBe(false)
    expect(isDeliverable('Ajman', 'Mirdif', areas)).toBe(false)
    expect(isDeliverable('Abu Dhabi', 'Business Bay', areas)).toBe(false)
  })
  it('rejects unlisted or empty areas', () => {
    expect(isDeliverable('Dubai', 'Jebel Ali', areas)).toBe(false)
    expect(isDeliverable('Dubai', '', areas)).toBe(false)
    expect(isDeliverable(undefined, 'Mirdif', areas)).toBe(false)
  })
})

describe('validateDeliveryAreasInput', () => {
  it('requires at least one line', () => {
    expect(validateDeliveryAreasInput('  \n ')).not.toBeNull()
  })
  it('caps lines and line length', () => {
    expect(validateDeliveryAreasInput(Array.from({ length: 101 }, (_, i) => `A${i}`).join('\n'))).not.toBeNull()
    expect(validateDeliveryAreasInput('x'.repeat(81))).not.toBeNull()
    expect(validateDeliveryAreasInput('Mirdif\nAl Qusais')).toBeNull()
  })
})
