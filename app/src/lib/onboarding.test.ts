import { describe, expect, it } from 'vitest'
import {
  EMPTY_GUIDE_STATE, GUIDE_STEPS, guideStorageKey, markDone, parseGuideState, progress, stepsForRole,
} from './onboarding'

describe('onboarding guide', () => {
  it('gives admins every step, staff the non-Settings ones, drivers none', () => {
    expect(stepsForRole('admin')).toHaveLength(GUIDE_STEPS.length)
    expect(stepsForRole('super_admin')).toHaveLength(GUIDE_STEPS.length)
    const staff = stepsForRole('staff').map(s => s.id)
    expect(staff).not.toContain('promo')
    expect(staff).not.toContain('delivery')
    expect(staff).toContain('add-product')
    expect(stepsForRole('driver')).toEqual([])
  })

  it('every step links to its own page with ?guide=<id>', () => {
    for (const s of GUIDE_STEPS) {
      expect(s.href.startsWith('/dashboard/')).toBe(true)
      expect(new URL(s.href, 'https://x.test').searchParams.get('guide')).toBe(s.id)
      expect(s.tip.length).toBeGreaterThan(0)
    }
  })

  it('reads corrupt or old storage as a fresh start and drops unknown steps', () => {
    expect(parseGuideState(null)).toEqual(EMPTY_GUIDE_STATE)
    expect(parseGuideState('{not json')).toEqual(EMPTY_GUIDE_STATE)
    expect(parseGuideState(JSON.stringify({ done: ['photos', 'photos', 'nope', 3], hidden: 'yes' })))
      .toEqual({ done: ['photos'], hidden: false })
  })

  it('counts progress against the role and marks done once', () => {
    let st = markDone(EMPTY_GUIDE_STATE, 'promo')
    st = markDone(st, 'promo')
    expect(st.done).toEqual(['promo'])
    expect(progress(st, 'staff')).toEqual({ done: 0, total: 5, complete: false })
    for (const s of stepsForRole('staff')) st = markDone(st, s.id)
    expect(progress(st, 'staff').complete).toBe(true)
    expect(progress(st, 'admin').complete).toBe(false)
  })

  it('keys storage by lower-cased email', () => {
    expect(guideStorageKey(' Mohsin@Example.com ')).toBe(guideStorageKey('mohsin@example.com'))
  })
})
