// Delivery areas: Dubai only, a named list around Ras Al Khor that the
// client edits in Dashboard > Settings (settings key `delivery_areas`,
// one area per line). The server check in POST /api/orders is the
// guarantee; the checkout dropdown is the convenience.
import type { SupabaseClient } from '@supabase/supabase-js'

export const DELIVERY_EMIRATE = 'Dubai'
export const DELIVERY_AREAS_KEY = 'delivery_areas'
export const MAX_DELIVERY_AREAS = 100
export const MAX_AREA_LENGTH = 80

export const DEFAULT_DELIVERY_AREAS: string[] = [
  'Ras Al Khor',
  'Ras Al Khor Industrial 1',
  'Ras Al Khor Industrial 2',
  'Ras Al Khor Industrial 3',
  'Al Jaddaf',
  'Nad Al Hamar',
  'Dubai Festival City',
  'Al Badia',
  'Al Warsan',
  'International City',
  'Dubai Silicon Oasis',
  'Mirdif',
  'Al Rashidiya',
  'Muhaisnah',
  'Al Qusais',
  'Al Garhoud',
  'Business Bay',
  'Dubai Creek Harbour',
]

export const DEFAULT_DELIVERY_AREAS_TEXT = DEFAULT_DELIVERY_AREAS.join('\n')

export const NOT_DELIVERABLE_MESSAGE = {
  en: 'We deliver only to areas near Ras Al Khor in Dubai for now. Message us on WhatsApp if you are close by.',
  ar: 'نوصل حاليا فقط إلى المناطق القريبة من رأس الخور في دبي. راسلنا على واتساب إذا كنت قريبا.',
} as const

function norm(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** One area per line, trimmed; blanks and duplicates dropped; default when empty. */
export function parseDeliveryAreas(value: string | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of String(value ?? '').split(/\r?\n/)) {
    const area = line.trim().replace(/\s+/g, ' ')
    if (!area) continue
    const key = norm(area)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(area)
  }
  return out.length > 0 ? out : [...DEFAULT_DELIVERY_AREAS]
}

/** Validation for the dashboard setting. Returns an error string or null. */
export function validateDeliveryAreasInput(value: unknown): string | null {
  const lines = String(value ?? '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return 'Add at least one delivery area'
  if (lines.length > MAX_DELIVERY_AREAS) return `Delivery areas can have at most ${MAX_DELIVERY_AREAS} lines`
  if (lines.some(l => l.length > MAX_AREA_LENGTH)) return `Each delivery area can be at most ${MAX_AREA_LENGTH} characters`
  return null
}

export function isDeliverable(
  emirate: string | null | undefined,
  area: string | null | undefined,
  areas: string[],
): boolean {
  const e = norm(String(emirate ?? ''))
  if (e !== norm(DELIVERY_EMIRATE) && e !== 'دبي') return false
  const a = norm(String(area ?? ''))
  if (!a) return false
  return areas.some(x => norm(x) === a)
}

export async function loadDeliveryAreas(supabase: SupabaseClient): Promise<string[]> {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', DELIVERY_AREAS_KEY).maybeSingle()
    return parseDeliveryAreas(data?.value as string | undefined)
  } catch {
    return [...DEFAULT_DELIVERY_AREAS]
  }
}
