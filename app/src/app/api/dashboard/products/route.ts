import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { cookies } from 'next/headers'

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'tmfood2024admin'

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.get('dashboard_auth')?.value === DASHBOARD_PASSWORD
}

export async function PATCH(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  const client = new MongoClient(process.env.MONGODB_URI!)

  try {
    await client.connect()
    await client.db().collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
    await client.close()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    await client.close().catch(() => {})
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
