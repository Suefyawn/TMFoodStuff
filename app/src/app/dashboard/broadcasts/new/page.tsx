import { redirect } from 'next/navigation'
import { isAdminAuthed } from '@/lib/admin-auth'
import ComposerClient from './ComposerClient'

export const dynamic = 'force-dynamic'

export default async function NewBroadcastPage() {
  if (!(await isAdminAuthed())) redirect('/dashboard/login')
  return <ComposerClient />
}
