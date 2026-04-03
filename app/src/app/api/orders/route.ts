import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WHATSAPP_NUMBER = '971544408411'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { form, items, subtotal, vat, deliveryFee, total, paymentMethod, promoCode, promoDiscount, deliverySlot } = body

    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      status: 'pending',
      payment_method: paymentMethod || 'cod',
      customer_name: form.fullName,
      customer_phone: form.phone,
      customer_email: form.email || '',
      delivery_emirate: form.emirate,
      delivery_area: form.area,
      delivery_building: form.building || '',
      delivery_makani: form.makani || '',
      delivery_slot: deliverySlot,
      delivery_notes: form.notes || '',
      subtotal,
      vat,
      delivery_fee: deliveryFee || 0,
      promo_code: promoCode || '',
      promo_discount: promoDiscount || 0,
      total,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price_aed: item.priceAED,
        subtotal: item.priceAED * item.quantity,
        unit: item.unit || 'kg',
      })),
    })

    if (error) throw error

    // WhatsApp message
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
      `💳 ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}\n` +
      (form.notes ? `📝 Notes: ${form.notes}` : '')
    )

    return NextResponse.json({ success: true, orderNumber, waMessage, waNumber: WHATSAPP_NUMBER })
  } catch (error: any) {
    console.error('Order error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
