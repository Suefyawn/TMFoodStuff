import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const WHATSAPP_NUMBER = '971544408411'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { form, items, subtotal, vat, deliveryFee, total, paymentMethod, promoCode, promoDiscount, deliverySlot } = body

    // Generate order number
    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`
    const createdAt = new Date()

    // Save to MongoDB
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('tmfoodstuff')

    const order = {
      orderNumber,
      createdAt,
      status: 'pending',
      customer: {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || '',
      },
      delivery: {
        emirate: form.emirate,
        area: form.area,
        building: form.building || '',
        makani: form.makani || '',
        notes: form.notes || '',
        slot: deliverySlot,
      },
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        nameAr: item.nameAr || item.name,
        quantity: item.quantity,
        priceAED: item.priceAED,
        unit: item.unit || 'kg',
        total: item.priceAED * item.quantity,
      })),
      payment: {
        method: paymentMethod,
        subtotal,
        vat,
        deliveryFee,
        promoCode: promoCode || '',
        promoDiscount: promoDiscount || 0,
        total,
      },
    }

    await db.collection('orders').insertOne(order)
    await client.close()

    // Build WhatsApp message for admin
    const itemsList = items.map((i: any) => `• ${i.name} x${i.quantity} = AED ${(i.priceAED * i.quantity).toFixed(2)}`).join('\n')
    const slotMap: Record<string, string> = { morning: '8AM-12PM', afternoon: '12PM-5PM', evening: '5PM-10PM' }

    const waMessage = encodeURIComponent(
      `🛒 NEW ORDER #${orderNumber}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 ${form.fullName}\n` +
      `📞 ${form.phone}\n` +
      `📍 ${form.area}, ${form.emirate}${form.building ? ` - ${form.building}` : ''}\n` +
      `🕐 Delivery: ${slotMap[deliverySlot] || deliverySlot}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${itemsList}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Subtotal: AED ${subtotal.toFixed(2)}\n` +
      `VAT (5%): AED ${vat.toFixed(2)}\n` +
      (promoDiscount > 0 ? `Promo (${promoCode}): -AED ${promoDiscount.toFixed(2)}\n` : '') +
      `💰 TOTAL: AED ${total.toFixed(2)}\n` +
      `💳 Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}\n` +
      (form.notes ? `📝 Notes: ${form.notes}` : '')
    )

    return NextResponse.json({
      success: true,
      orderNumber,
      waMessage,
      waNumber: WHATSAPP_NUMBER,
    })
  } catch (error: any) {
    console.error('Order error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
