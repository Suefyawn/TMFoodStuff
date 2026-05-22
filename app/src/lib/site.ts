// Single source of truth for the public site URL. Set NEXT_PUBLIC_SITE_URL in
// the environment; the trailing slash (if any) is stripped so callers can
// safely do `${SITE_URL}/path`.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tmfoodstuff.ae'
).replace(/\/+$/, '')
