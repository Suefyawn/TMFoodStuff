// Safely parse a JSON request body. Returns null on malformed/absent JSON so
// callers can return a clean 400 instead of throwing an unhandled 500.
// Public, unauthenticated endpoints especially must not 500 on garbage input.
export async function readJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
