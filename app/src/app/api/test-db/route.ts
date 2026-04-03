import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    await client.connect()
    const db = client.db()
    const collections = await db.listCollections().toArray()
    await client.close()
    return NextResponse.json({ ok: true, collections: collections.map((c: any) => c.name) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
