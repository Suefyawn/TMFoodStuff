/**
 * All dashboard browser calls should use this so cookies, JSON errors, and 401 are handled consistently.
 */
export type DashboardFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data: null }

export async function dashboardFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<DashboardFetchResult<T>> {
  const url = path.startsWith('http') ? path : path
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers,
  })

  const contentType = res.headers.get('content-type') || ''
  let body: unknown = null
  if (contentType.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = null
    }
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.assign('/dashboard/login')
    }
    return { ok: false, status: 401, error: 'Unauthorized', data: null }
  }

  if (!res.ok) {
    const err =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${res.status})`
    return { ok: false, status: res.status, error: err, data: null }
  }

  return { ok: true, status: res.status, data: body as T }
}
