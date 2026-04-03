import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('dashboard_auth')
  
  if (auth?.value !== DASHBOARD_PASSWORD) {
    redirect('/dashboard/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {children}
    </div>
  )
}
