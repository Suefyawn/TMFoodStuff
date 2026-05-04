import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation, sendAdminOrderAlert, type OrderEmailData } from '@/lib/email'

const DEFAULT_WHATSAPP_NUMBER = '971544408411'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { form, items, subtotal, vat, deliveryFee, total, paymentMethod, promoCode, promoDiscount, deliverySlot } = body

    if (!form || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid order payload' }, { status: 400 })
    }

    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch store settings for pricing/whatsapp consistency.
    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const row of (settingsRows || [])) settings[row.key] = row.value
    const whatsappNumber = (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') || DEFAULT_WHATSAPP_NUMBER

    // Write to both the legacy columns (subtotal/vat/total) and the canonical
    // `_aed` columns so dashboards and reporting tools keep working regardless
    // of which schema they were authored against.
    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      status: 'pending',
      payment_method: paymentMethod || 'cod',
      payment_status: 'pending',
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
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price_aed: item.priceAED,
        subtotal: item.priceAED * item.quantity,
        unit: item.unit || 'kg',
      })),
    }

    const { error } = await supabase.from('orders').insert(payload)

    if (error) throw error

    // Send emails (graceful no-ops if RESEND_API_KEY is not set)
    const emailData: OrderEmailData = {
      order_number: orderNumber,
      customer_name: form.fullName,
      customer_phone: form.phone,
      customer_email: form.email || undefined,
      delivery_area: form.area,
      delivery_emirate: form.emirate,
      delivery_building: form.building || undefined,
      delivery_slot: deliverySlot,
      delivery_notes: form.notes || undefined,
      delivery_fee: deliveryFee || 0,
      subtotal,
      vat,
      promo_code: promoCode || undefined,
      promo_discount: promoDiscount || 0,
      total,
      items: items.map((item: any) => ({
        name: item.name,
        emoji: item.emoji,
        quantity: item.quantity,
        price_aed: item.priceAED,
      })),
      whatsapp_number: whatsappNumber,
    }
    await Promise.all([
      sendOrderConfirmation(emailData),
      sendAdminOrderAlert(emailData),
    ])

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

    return NextResponse.json({ success: true, orderNumber, waMessage, waNumber: whatsappNumber })
  } catch (error: any) {
    console.error('Order error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
