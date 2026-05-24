// Shared client/server input validators. Kept small and dependency-free so
// they can be imported from both 'use client' components and route handlers.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(input: unknown): input is string {
  return typeof input === 'string' && EMAIL_RE.test(input.trim())
}

// UAE mobile numbers are +971 followed by 9 digits starting with 5 (mobile)
// or a 2-digit area code (landline). Accepts the common entry formats:
// "+971501234567", "971501234567", "0501234567", "501234567".
const UAE_PHONE_RE = /^(?:\+?971|0)?(?:5\d{8}|[2-9]\d{7,8})$/

export function isValidUAEPhone(input: unknown): input is string {
  if (typeof input !== 'string') return false
  const digits = input.replace(/[\s-]/g, '')
  return UAE_PHONE_RE.test(digits)
}

// Normalise for storage/notification: returns E.164-style "+9715XXXXXXXX"
// when the input looks UAE-shaped; otherwise returns the trimmed input
// unchanged (so non-UAE numbers still pass through).
export function normaliseUAEPhone(input: string): string {
  const cleaned = input.replace(/[\s-]/g, '').trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('+971')) return cleaned
  if (cleaned.startsWith('971')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+971${cleaned.slice(1)}`
  if (/^5\d{8}$/.test(cleaned)) return `+971${cleaned}`
  return cleaned
}
