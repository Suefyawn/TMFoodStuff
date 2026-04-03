import { MongoClient } from 'mongodb'
const client = new MongoClient('mongodb+srv://Sooviaan:Bh!mb3r1996@cluster0.bg96apw.mongodb.net/tmfoodstuff?appName=Cluster0')
try {
  await client.connect()
  const db = client.db('tmfoodstuff')
  const cols = await db.listCollections().toArray()
  console.log('Connected! Collections:', cols.map(c => c.name).join(', '))
  const prodCount = await db.collection('products').countDocuments()
  const catCount = await db.collection('categories').countDocuments()
  console.log(`Products: ${prodCount}, Categories: ${catCount}`)
  await client.close()
} catch(e) {
  console.log('Error:', e.message)
}
