// Thin wrapper around Zod's safeParse for API route bodies.
//
// Usage:
//   const parsed = await parseJsonBody(request, OrderSchema)
//   if (!parsed.ok) return parsed.response
//   const body = parsed.data
//
// The error response contains a flat fieldErrors map so the storefront
// can highlight the exact field that's wrong instead of showing a
// generic "Invalid order payload".
import { NextResponse } from 'next/server'
import type { ZodType, ZodError } from 'zod'

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      ),
    }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Invalid request body',
          fieldErrors: flattenFieldErrors(parsed.error),
        },
        { status: 400 },
      ),
    }
  }
  return { ok: true, data: parsed.data }
}

// "form.phone" → "Invalid UAE phone number" instead of Zod's nested issues array.
function flattenFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    // Keep the first error per field — usually the most actionable.
    if (!out[key]) out[key] = issue.message
  }
  return out
}
