import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const WHATSAPP_NUMBER = '971544408411'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { form, items, subtotal, vat, deliveryFee, total, paymentMethod, promoCode, promoDiscount, deliverySlot } = body

    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`

    // Save via Payload CMS
    const payload = await getPayload({ config })

    await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        status: 'pending',
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: 'pending',
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
          slot: deliverySlot,
          notes: form.notes || '',
        },
        items: items.map((item: any) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          priceAED: item.priceAED,
          subtotal: item.priceAED * item.quantity,
          unit: item.unit || 'kg',
        })),
        pricing: {
          subtotal,
          vat,
          deliveryFee,
          promoCode: promoCode || '',
          promoDiscount: promoDiscount || 0,
          total,
        },
        totalAED: total,
      },
    })

    // Build WhatsApp message for admin notification
    const itemsList = items
      .map((i: any) => `• ${i.name} x${i.quantity} = AED ${(i.priceAED * i.quantity).toFixed(2)}`)
      .join('\n')
    const slotMap: Record<string, string> = {
      morning: '8AM-12PM',
      afternoon: '12PM-5PM',
      evening: '5PM-10PM',
    }

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
      `💳 ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}\n` +
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
