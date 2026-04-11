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

    const orderPayload = {
      order_number: orderNumber,
      status: 'pending',
      payment_method: paymentMethod || 'cod',
      customer_name: form.fullName,
      customer_full_name: form.fullName,
      customer_phone: form.phone,
      customer_email: form.email || '',
      delivery_emirate: form.emirate,
      delivery_area: form.area,
      delivery_building: form.building || '',
      delivery_makani: form.makani || '',
      delivery_slot: deliverySlot,
      delivery_notes: form.notes || '',
      subtotal,
      subtotal_aed: subtotal,
      vat,
      vat_aed: vat,
      delivery_fee: deliveryFee || 0,
      delivery_fee_aed: deliveryFee || 0,
      promo_code: promoCode || '',
      promo_discount: promoDiscount || 0,
      promo_discount_aed: promoDiscount || 0,
      total,
      total_aed: total,
      placed_at: new Date().toISOString(),
    }

    const itemsPayload = items.map((item: any) => ({
      id: item.id,
      product_id: Number.isFinite(Number(item.id)) ? Number(item.id) : null,
      product_name: item.name,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'kg',
      unit_price_aed: Number(item.priceAED) || 0,
      price_aed: Number(item.priceAED) || 0,
      priceAED: Number(item.priceAED) || 0,
      subtotal_aed: (Number(item.priceAED) || 0) * (Number(item.quantity) || 1),
      subtotal: (Number(item.priceAED) || 0) * (Number(item.quantity) || 1),
    }))

    const { data: createdRows, error: rpcError } = await supabase.rpc('create_checkout_order', {
      p_order: orderPayload,
      p_items: itemsPayload,
    })

    if (rpcError) throw rpcError
    if (!createdRows?.length) throw new Error('Failed to create order')

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
