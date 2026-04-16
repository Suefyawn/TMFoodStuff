import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LogoutPage() {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  cookieStore.delete('dashboard_auth')
  redirect('/dashboard/login')
}
