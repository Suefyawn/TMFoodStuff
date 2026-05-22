import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmation, sendAdminOrderAlert, toLocale, type OrderEmailData } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { computeOrderTotals, subtotalOf, round2 } from '@/lib/pricing'

const DEFAULT_WHATSAPP_NUMBER = '971544408411'
const VALID_SLOTS = ['morning', 'afternoon', 'evening']

function parseNum(value: string | undefined, fallback: number): number {
  const n = parseFloat(value ?? '')
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

// Calendar dates (Asia/Dubai) the customer is allowed to pick. The checkout UI
// offers today..+2; we accept today..+3 so a client/server timezone offset
// around midnight never rejects a legitimate order.
function acceptableDeliveryDates(): string[] {
  const dates: string[] = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(Date.now() + i * 86_400_000)
    dates.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }))
  }
  return dates
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`orders:${getClientIp(request)}`, 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { form, items, paymentMethod, promoCode, deliverySlot, deliveryDate, lang } = body

    if (!form || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid order payload' }, { status: 400 })
    }

    const locale = toLocale(lang)

    // ── Validate customer details ──────────────────────────────────────────
    const fullName = String(form.fullName || '').trim()
    const phone = String(form.phone || '').trim()
    const emirate = String(form.emirate || '').trim()
    const area = String(form.area || '').trim()
    const email = String(form.email || '').trim()
    if (!fullName || !phone || !emirate || !area) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required delivery details.' },
        { status: 400 },
      )
    }
    if (fullName.length > 120 || phone.length > 40 || area.length > 200 || email.length > 160) {
      return NextResponse.json({ success: false, error: 'One or more fields are too long.' }, { status: 400 })
    }
    if (email && !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // ── Validate delivery slot / date ──────────────────────────────────────
    if (!VALID_SLOTS.includes(deliverySlot)) {
      return NextResponse.json({ success: false, error: 'Please choose a valid delivery slot.' }, { status: 400 })
    }
    if (!deliveryDate || !acceptableDeliveryDates().includes(String(deliveryDate))) {
      return NextResponse.json({ success: false, error: 'Please choose a valid delivery date.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── Resolve cart items to authoritative products ───────────────────────
    // Only the product id and quantity are trusted from the client; everything
    // that affects price comes from the database.
    const quantities: Record<string, number> = {}
    for (const it of items) {
      const id = String(it?.id ?? '')
      const qty = Math.floor(Number(it?.quantity))
      if (!id || !Number.isFinite(qty) || qty <= 0 || qty > 1000) {
        return NextResponse.json({ success: false, error: 'Your cart contains an invalid item.' }, { status: 400 })
      }
      quantities[id] = (quantities[id] || 0) + qty
    }
    const productIds = Object.keys(quantities)

    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price_aed, unit, stock, is_active, emoji')
      .in('id', productIds)
    if (prodErr) throw prodErr

    const productById: Record<string, any> = {}
    for (const p of products || []) productById[String(p.id)] = p

    const lineItems: Array<{
      id: number | string
      name: string
      emoji: string
      unit: string
      quantity: number
      price_aed: number
      subtotal: number
    }> = []

    for (const id of productIds) {
      const qty = quantities[id]
      const p = productById[id]
      if (!p || !p.is_active) {
        return NextResponse.json(
          { success: false, error: 'A product in your cart is no longer available. Please review your cart.' },
          { status: 400 },
        )
      }
      if (Number(p.stock) < qty) {
        return NextResponse.json(
          { success: false, error: `Sorry, "${p.name}" only has ${p.stock} left in stock.` },
          { status: 400 },
        )
      }
      const price = round2(Number(p.price_aed))
      lineItems.push({
        id: p.id,
        name: p.name,
        emoji: p.emoji || '',
        unit: p.unit || 'kg',
        quantity: qty,
        price_aed: price,
        subtotal: round2(price * qty),
      })
    }

    // ── Store settings (pricing + WhatsApp) ────────────────────────────────
    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const row of settingsRows || []) settings[row.key] = row.value
    const whatsappNumber =
      (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') || DEFAULT_WHATSAPP_NUMBER

    // ── Recompute pricing server-side (client values are never trusted) ────
    const vatRatePercent = parseNum(settings.vat_rate, 5)
    const launchFreeDelivery = process.env.NEXT_PUBLIC_LAUNCH_FREE_DELIVERY !== 'false'
    const cartSubtotal = subtotalOf(lineItems)
    const resolvedDeliveryFee = launchFreeDelivery
      ? 0
      : cartSubtotal >= parseNum(settings.free_delivery_threshold, 150)
        ? 0
        : parseNum(settings.delivery_fee, 15)

    // ── Re-validate the promo code server-side ─────────────────────────────
    let appliedPromoCode = ''
    let promoDiscountPercent = 0
    if (promoCode && String(promoCode).trim()) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('code, discount_percent, expires_at, is_active')
        .eq('is_active', true)
        .ilike('code', String(promoCode).trim())
        .maybeSingle()
      if (promo && (!promo.expires_at || new Date(promo.expires_at) >= new Date())) {
        appliedPromoCode = promo.code
        promoDiscountPercent = Number(promo.discount_percent) || 0
      }
    }

    const { subtotal, vat, deliveryFee, promoDiscount, total } = computeOrderTotals({
      lineItems,
      vatRatePercent,
      deliveryFee: resolvedDeliveryFee,
      promoDiscountPercent,
    })
    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      status: 'pending',
      payment_method: paymentMethod === 'card' ? 'card' : 'cod',
      payment_status: 'pending',
      locale,
      customer_name: fullName,
      customer_full_name: fullName,
      customer_phone: phone,
      customer_email: email,
      delivery_emirate: emirate,
      delivery_area: area,
      delivery_building: String(form.building || '').trim().slice(0, 200),
      delivery_makani: String(form.makani || '').trim().slice(0, 100),
      delivery_slot: deliverySlot,
      delivery_date: deliveryDate,
      delivery_notes: String(form.notes || '').trim().slice(0, 1000),
      // Both legacy and canonical `_aed` columns kept in sync.
      subtotal,
      subtotal_aed: subtotal,
      vat,
      vat_aed: vat,
      delivery_fee: deliveryFee,
      delivery_fee_aed: deliveryFee,
      promo_code: appliedPromoCode,
      promo_discount: promoDiscount,
      promo_discount_aed: promoDiscount,
      total,
      total_aed: total,
      items: lineItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price_aed: i.price_aed,
        subtotal: i.subtotal,
        unit: i.unit,
      })),
    }

    const { error } = await supabase.from('orders').insert(payload)
    if (error) throw error

    // ── Decrement stock atomically (oversell guard) ────────────────────────
    await Promise.all(
      lineItems.map(async (i) => {
        const { data: ok, error: rpcErr } = await supabase.rpc('decrement_stock', {
          p_id: Number(i.id),
          p_qty: i.quantity,
        })
        if (rpcErr || ok === false) {
          console.error(`Stock decrement failed for product ${i.id} on order ${orderNumber}`, rpcErr)
        }
      }),
    )

    // ── Notifications (graceful no-ops if RESEND_API_KEY is not set) ───────
    const emailData: OrderEmailData = {
      order_number: orderNumber,
      customer_name: fullName,
      customer_phone: phone,
      customer_email: email || undefined,
      delivery_area: area,
      delivery_emirate: emirate,
      delivery_building: String(form.building || '').trim() || undefined,
      delivery_slot: deliverySlot,
      delivery_notes: String(form.notes || '').trim() || undefined,
      delivery_fee: deliveryFee,
      subtotal,
      vat,
      promo_code: appliedPromoCode || undefined,
      promo_discount: promoDiscount,
      total,
      items: lineItems.map((i) => ({
        name: i.name,
        emoji: i.emoji,
        quantity: i.quantity,
        price_aed: i.price_aed,
      })),
      whatsapp_number: whatsappNumber,
      locale,
    }
    await Promise.all([sendOrderConfirmation(emailData), sendAdminOrderAlert(emailData)])

    // ── WhatsApp confirmation message ──────────────────────────────────────
    const itemsList = lineItems
      .map((i) => `• ${i.name} x${i.quantity} = AED ${i.subtotal.toFixed(2)}`)
      .join('\n')
    const slotMap: Record<string, string> = {
      morning: '8AM-12PM',
      afternoon: '12PM-5PM',
      evening: '5PM-10PM',
    }
    const waMessage = encodeURIComponent(
      `🛒 NEW ORDER #${orderNumber}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `👤 ${fullName}\n` +
        `📞 ${phone}\n` +
        `📍 ${area}, ${emirate}${form.building ? ` - ${form.building}` : ''}\n` +
        `🕐 Delivery: ${slotMap[deliverySlot] || deliverySlot}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `${itemsList}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `Subtotal: AED ${subtotal.toFixed(2)}\n` +
        `VAT: AED ${vat.toFixed(2)}\n` +
        (deliveryFee > 0 ? `Delivery: AED ${deliveryFee.toFixed(2)}\n` : '') +
        (promoDiscount > 0 ? `Promo (${appliedPromoCode}): -AED ${promoDiscount.toFixed(2)}\n` : '') +
        `💰 TOTAL: AED ${total.toFixed(2)}\n` +
        `💳 ${paymentMethod === 'card' ? 'Card' : 'Cash on Delivery'}\n` +
        (form.notes ? `📝 Notes: ${String(form.notes).trim()}` : ''),
    )

    return NextResponse.json({
      success: true,
      orderNumber,
      subtotal,
      vat,
      deliveryFee,
      promoCode: appliedPromoCode,
      promoDiscount,
      total,
      waMessage,
      waNumber: whatsappNumber,
    })
  } catch (error) {
    console.error('Order error:', error)
    return NextResponse.json(
      { success: false, error: 'Could not place your order. Please try again.' },
      { status: 500 },
    )
  }
}
