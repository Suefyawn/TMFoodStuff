// First-run guide for dashboard staff. The steps mirror the Help page
// (/dashboard/help) one to one, so a tip, its checklist row and its Help
// section always say the same thing.
//
// Progress is kept per person in the browser (localStorage, keyed by the
// signed-in email). It is a learning aid, not business data: losing it only
// means the checklist shows again. No table, no migration.

export type GuideRole = 'super_admin' | 'admin' | 'staff' | 'driver'

export type GuideStepId =
  | 'add-product'
  | 'photos'
  | 'edit-product'
  | 'show-hide'
  | 'categories'
  | 'promo'
  | 'delivery'

export interface GuideStep {
  id: GuideStepId
  title: string
  // One sentence on the checklist row.
  summary: string
  // The tip shown on the page itself, as short numbered steps.
  tip: string[]
  // Where "Show me" goes. The page reads ?guide=<id> to open its tip.
  href: string
  // Section id on /dashboard/help.
  helpAnchor: string
  adminOnly?: boolean
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'add-product',
    title: 'Add a product',
    summary: 'Put a new item in the shop with its name, price, unit and stock.',
    tip: [
      'Press the green Add Product button at the top right.',
      'Fill in Name and Price (AED). For Unit type just kg, piece, box or bunch.',
      'Press Add Product at the bottom of the form. New products show in the shop straight away.',
    ],
    href: '/dashboard/products?guide=add-product',
    helpAnchor: 'add-product',
  },
  {
    id: 'photos',
    title: 'Add photos',
    summary: 'Give a product up to 6 pictures and pick the main one.',
    tip: [
      'Press Edit on a product (or open Add Product).',
      'Under Product Images, press the picture box (it says Add more once there is a photo) and choose a picture, up to 5 MB.',
      'Press Set Primary on the picture customers should see first, then save.',
    ],
    href: '/dashboard/products?guide=photos',
    helpAnchor: 'photos',
  },
  {
    id: 'edit-product',
    title: 'Change a price or stock',
    summary: 'Find a product by name and update it.',
    tip: [
      'Type the product name in the search box.',
      'Press Edit at the end of its row, change what you need and press Save Changes.',
      'On a computer, the minus and plus buttons beside the stock number change it by one.',
    ],
    href: '/dashboard/products?guide=edit-product',
    helpAnchor: 'edit-product',
  },
  {
    id: 'show-hide',
    title: 'Hide or show a product',
    summary: 'Take an item off the shop without deleting it.',
    tip: [
      'Press the Active button on a product row. It turns Inactive and customers no longer see it.',
      'Press it again to put the product back.',
      'Use Deactivate rather than Delete when you only want an item hidden.',
    ],
    href: '/dashboard/products?guide=show-hide',
    helpAnchor: 'show-hide',
  },
  {
    id: 'categories',
    title: 'Set up categories',
    summary: 'Group products so customers can browse them.',
    tip: [
      'Press Add Category, type a name and press Add.',
      'Press Edit on a row to rename it.',
      'Move products out before you delete a category, or they become uncategorized.',
    ],
    href: '/dashboard/categories?guide=categories',
    helpAnchor: 'categories',
  },
  {
    id: 'promo',
    title: 'Create a promo code',
    summary: 'Give customers a percentage off with a code.',
    tip: [
      'Type the code in capitals, for example WELCOME10, and the Discount %.',
      'Pick an end date or leave it empty, then press the green + button.',
      'Press Save Settings at the top. The code does not work until you save.',
    ],
    href: '/dashboard/settings?tab=promos&guide=promo',
    helpAnchor: 'promo',
    adminOnly: true,
  },
  {
    id: 'delivery',
    title: 'Check your delivery areas',
    summary: 'Make sure the shop only takes orders you can deliver.',
    tip: [
      'Find the box called Delivery areas (Dubai). Each line is one area.',
      'Delete a line to stop delivering there, add a line to start.',
      'Press Save Settings at the top and wait for Saved!',
    ],
    href: '/dashboard/settings?tab=delivery&guide=delivery',
    helpAnchor: 'delivery',
    adminOnly: true,
  },
]

export function isAdminRole(role: GuideRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

// Drivers never see the guide; staff skip the admin-only Settings steps.
export function stepsForRole(role: GuideRole): GuideStep[] {
  if (role === 'driver') return []
  return GUIDE_STEPS.filter(s => !s.adminOnly || isAdminRole(role))
}

export function getStep(id: string | null | undefined): GuideStep | undefined {
  return GUIDE_STEPS.find(s => s.id === id)
}

export interface GuideState {
  done: GuideStepId[]
  hidden: boolean
}

export const EMPTY_GUIDE_STATE: GuideState = { done: [], hidden: false }

export function guideStorageKey(email: string): string {
  return `tmf-guide:v1:${email.trim().toLowerCase()}`
}

// Tolerates anything a browser might hand back: missing, corrupt, old shape.
export function parseGuideState(raw: string | null): GuideState {
  if (!raw) return EMPTY_GUIDE_STATE
  try {
    const v = JSON.parse(raw) as Partial<GuideState>
    const known = new Set<string>(GUIDE_STEPS.map(s => s.id))
    const done = Array.isArray(v.done)
      ? Array.from(new Set(v.done.filter((d): d is GuideStepId => typeof d === 'string' && known.has(d))))
      : []
    return { done, hidden: v.hidden === true }
  } catch {
    return EMPTY_GUIDE_STATE
  }
}

export function markDone(state: GuideState, id: GuideStepId): GuideState {
  if (state.done.includes(id)) return state
  return { ...state, done: [...state.done, id] }
}

export function progress(state: GuideState, role: GuideRole): { done: number; total: number; complete: boolean } {
  const steps = stepsForRole(role)
  const done = steps.filter(s => state.done.includes(s.id)).length
  return { done, total: steps.length, complete: steps.length > 0 && done === steps.length }
}
