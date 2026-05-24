// Server-side helpers for admin-managed delivery slots.
//
// Slot definitions live in the delivery_slots table. The `key` column is
// the immutable storage value used by orders.delivery_slot and every
// downstream render path — admins can rename labels and tune times/
// capacity, but the key is never edited (would orphan existing orders).
//
// Capacity + cutoff_hour gate which slot+date pairs are bookable. Both
// are enforced server-side in /api/orders; the checkout UI mirrors them
// from this same module via GET /api/delivery-slots so the picker never
// shows an option the API would reject.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface DeliverySlot {
  id: number
  key: string
  label_en: string
  label_ar: string
  time_label_en: string
  time_label_ar: string
  cutoff_hour: number | null
  max_orders_per_day: number | null
  day_of_week_mask: number
  position: number
  is_active: boolean
}

export interface SlotAvailability extends DeliverySlot {
  // Whether the slot is bookable for the given date considering cutoff,
  // day-of-week mask, and current capacity.
  available: boolean
  // Reason it's NOT available, when available=false. UI uses this to render
  // a disabled chip with a tooltip.
  reason?: 'cutoff_passed' | 'day_off' | 'full'
  // How many orders already booked for this slot+date.
  booked: number
}

// "Today" in UAE local time so cutoffs match what the customer sees on
// their clock, regardless of where the server runs.
function dubaiNow(): { dateIso: string; hour: number; dayOfWeek: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find(p => p.type === t)?.value || ''
  const dateIso = `${get('year')}-${get('month')}-${get('day')}`
  const hour = Number(get('hour'))
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { dateIso, hour, dayOfWeek: weekdayMap[get('weekday')] ?? 0 }
}

function dayOfWeekFromIso(iso: string): number {
  // Parse YYYY-MM-DD as a UTC date and read its day-of-week. Since the
  // value is just a date (no time), UTC parsing avoids local-tz drift.
  const d = new Date(`${iso}T00:00:00Z`)
  return d.getUTCDay()
}

export async function getActiveSlots(supabase: SupabaseClient): Promise<DeliverySlot[]> {
  const { data, error } = await supabase
    .from('delivery_slots')
    .select('id, key, label_en, label_ar, time_label_en, time_label_ar, cutoff_hour, max_orders_per_day, day_of_week_mask, position, is_active')
    .eq('is_active', true)
    .order('position', { ascending: true })
  if (error) {
    console.error('[delivery-slots] active select failed:', error)
    return []
  }
  return (data || []) as DeliverySlot[]
}

// Returns availability for every active slot on the given date (YYYY-MM-DD,
// UAE-local). Used by the checkout UI to disable/explain unbookable slots.
export async function getSlotAvailabilityForDate(
  supabase: SupabaseClient,
  dateIso: string,
): Promise<SlotAvailability[]> {
  const slots = await getActiveSlots(supabase)
  if (slots.length === 0) return []

  const { dateIso: todayIso, hour } = dubaiNow()
  const isToday = dateIso === todayIso
  const isPast = dateIso < todayIso
  const dow = dayOfWeekFromIso(dateIso)
  const dowBit = 1 << dow

  // Count current bookings per slot for the date in one query.
  const { data: bookings } = await supabase
    .from('orders')
    .select('delivery_slot')
    .eq('delivery_date', dateIso)
    .neq('status', 'cancelled')
  const counts = new Map<string, number>()
  for (const row of bookings || []) {
    const k = (row as { delivery_slot: string | null }).delivery_slot
    if (k) counts.set(k, (counts.get(k) || 0) + 1)
  }

  return slots.map(s => {
    const booked = counts.get(s.key) || 0
    let available = true
    let reason: SlotAvailability['reason'] | undefined

    if (isPast) {
      available = false
      reason = 'cutoff_passed'
    } else if (!(s.day_of_week_mask & dowBit)) {
      available = false
      reason = 'day_off'
    } else if (isToday && (s.cutoff_hour == null || hour >= s.cutoff_hour)) {
      available = false
      reason = 'cutoff_passed'
    } else if (s.max_orders_per_day != null && booked >= s.max_orders_per_day) {
      available = false
      reason = 'full'
    }

    return { ...s, available, reason, booked }
  })
}

// Hard-validate a slot+date pair before persisting an order. Mirrors the
// availability logic above but only cares about the yes/no answer + a
// human-readable reason for the error response.
export async function validateSlotForDate(
  supabase: SupabaseClient,
  slotKey: string,
  dateIso: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const availability = await getSlotAvailabilityForDate(supabase, dateIso)
  const slot = availability.find(s => s.key === slotKey)
  if (!slot) return { ok: false, reason: 'That delivery slot is not available.' }
  if (slot.available) return { ok: true }
  const messages: Record<NonNullable<SlotAvailability['reason']>, string> = {
    cutoff_passed: 'The cutoff for that slot has passed — please choose a later slot or date.',
    day_off: "We don't deliver in that slot on the selected day.",
    full: 'That slot is fully booked — please choose another.',
  }
  return { ok: false, reason: messages[slot.reason || 'cutoff_passed'] }
}
