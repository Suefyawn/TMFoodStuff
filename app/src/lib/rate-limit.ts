// Best-effort in-memory per-key rate limiter.
//
// NOTE: state lives in the process memory of a single serverless instance, so
// limits are approximate when traffic is spread across instances. It is a solid
// speed bump against spam/brute-force but not a strict global quota. For hard
// global limits, swap this for a shared store such as Upstash Redis
// (@upstash/ratelimit).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Returns true if the request is allowed, false if the key is over its quota.
 * @param key       unique bucket key (e.g. `orders:<ip>`)
 * @param limit     max requests allowed per window
 * @param windowMs  window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10_000) {
      buckets.forEach((b, k) => {
        if (now > b.resetAt) buckets.delete(k)
      })
    }
    return true
  }

  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

/** Extracts the client IP from a request, falling back to a constant. */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
