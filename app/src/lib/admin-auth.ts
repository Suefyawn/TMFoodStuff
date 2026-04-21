import { cookies } from 'next/headers'
import crypto from 'crypto'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

export function getExpectedSessionToken(): string {
  return crypto.createHash('sha256').update(DASHBOARD_PASSWORD).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('dashboard_auth')?.value
  if (!token) return false
  // Accept the derived session token or the legacy raw-password cookie
  // (issued by older versions of this app) to avoid signing out active sessions.
  return safeEqual(token, getExpectedSessionToken()) || safeEqual(token, DASHBOARD_PASSWORD)
}
