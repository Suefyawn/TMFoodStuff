import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logError, getRequestId } from '@/lib/log'
import { parseJsonBody } from '@/lib/validate-body'
import { OrderBodySchema } from '@/lib/schemas/orders'
import { computeOrderTotals, subtotalOf, round2 } from '@/lib/pricing'
import { fulfillOrder } from '@/lib/order-fulfillment'
import { toLocale } from '@/lib/locale'
import { getStripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/site'
import { isValidEmail, isValidUAEPhone, normaliseUAEPhone } from '@/lib/validators'
import { resolveRedemption } from '@/lib/points'
import { recordReferralOnFirstOrder, REFERRAL_COOKIE } from '@/lib/referrals'
import { clearCustomerCart } from '@/lib/cart-recovery'
import { validateSlotForDate } from '@/lib/delivery-slots'
import { getCurrentCustomer } from '@/lib/customer'
import { getCustomerBalance, recordRedemption } from '@/lib/loyalty'

const DEFAULT_WHATSAPP_NUMBER = '971544408411'

function parseNum(value: string | undefined, fallback: number): number {
  const n = parseFloat(value ?? '')
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function acceptableDeliveryDates(): string[] {
  const dates: string[] = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(Date.now() + i * 86_400_000)
    dates.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }))
  }
  return dates
}

export async function POST(request: Request) {
  const reqId = getRequestId(request)
  try {
    if (!rateLimit(`orders:${getClientIp(request)}`, 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 },
      )
    }

    const parsed = await parseJsonBody(request, OrderBodySchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data
    const { form, items, paymentMethod, promoCode, deliverySlot, deliveryDate, locale: rawLocale, pointsToRedeem } = body
    const locale = toLocale(rawLocale)
    const isCardPayment = paymentMethod === 'card'
    const pointsRequested = Math.max(0, Math.floor(Number(pointsToRedeem) || 0))

    const fullName = form.fullName
    const phone = form.phone
    const emirate = form.emirate
    const area = form.area
    const email = form.email
    if (!isValidUAEPhone(phone)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid UAE phone number, e.g. 0501234567.' }, { status: 400 })
    }
    const normalisedPhone = normaliseUAEPhone(phone)
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (!acceptableDeliveryDates().includes(deliveryDate)) {
      return NextResponse.json({ success: false, error: 'Please choose a valid delivery date.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Hard-validate the slot+date pair against the admin-managed slot
    // table. Catches: unknown slot key, slot disabled for that weekday,
    // cutoff already passed, slot at capacity. Mirrors what the storefront
    // /api/delivery-slots?date= endpoint surfaces.
    const slotCheck = await validateSlotForDate(supabase, String(deliverySlot), String(deliveryDate))
    if (!slotCheck.ok) {
      return NextResponse.json({ success: false, error: slotCheck.reason }, { status: 400 })
    }

    // ── Resolve cart items to authoritative products ───────────────────────
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

    const productById: Record<string, {
      id: number
      name: string
      price_aed: number
      unit: string | null
      stock: number | null
      is_active: boolean | null
      emoji: string | null
    }> = {}
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

    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const row of settingsRows || []) settings[row.key] = row.value
    const whatsappNumber =
      (settings.whatsapp_number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '') || DEFAULT_WHATSAPP_NUMBER

    const vatRatePercent = parseNum(settings.vat_rate, 5)
    const launchFreeDelivery = process.env.NEXT_PUBLIC_LAUNCH_FREE_DELIVERY !== 'false'
    const cartSubtotal = subtotalOf(lineItems)
    const resolvedDeliveryFee = launchFreeDelivery
      ? 0
      : cartSubtotal >= parseNum(settings.free_delivery_threshold, 150)
        ? 0
        : parseNum(settings.delivery_fee, 15)

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

    const { subtotal, vat, deliveryFee, promoDiscount, total: totalBeforePoints } = computeOrderTotals({
      lineItems,
      vatRatePercent,
      deliveryFee: resolvedDeliveryFee,
      promoDiscountPercent,
    })

    // ── Loyalty points redemption (signed-in customers only) ──────────────
    let pointsRedeemed = 0
    let pointsValueAed = 0
    let redeemingCustomerId: number | null = null
    if (pointsRequested > 0) {
      const customer = await getCurrentCustomer()
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Sign in to redeem loyalty points.' }, { status: 401 })
      }
      const balance = await getCustomerBalance(supabase, customer.id)
      // Allow redeeming against the discounted-subtotal so points stack with
      // a promo code but never let the order go below the VAT line.
      const redeemableBase = Math.max(0, subtotal - promoDiscount)
      const resolved = resolveRedemption({
        pointsRequested,
        balance,
        subtotalAed: redeemableBase,
      })
      if (resolved.aed <= 0) {
        return NextResponse.json({ success: false, error: resolved.reason || 'Could not redeem points.' }, { status: 400 })
      }
      pointsRedeemed = resolved.points
      pointsValueAed = resolved.aed
      redeemingCustomerId = customer.id
    }

    const total = round2(Math.max(0, totalBeforePoints - pointsValueAed))
    const orderNumber = `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      status: 'pending',
      payment_method: isCardPayment ? 'card' : 'cod',
      payment_status: 'pending',
      customer_name: fullName,
      customer_full_name: fullName,
      customer_phone: normalisedPhone,
      customer_email: email,
      delivery_emirate: emirate,
      delivery_area: area,
      delivery_building: form.building,
      delivery_makani: form.makani,
      delivery_slot: deliverySlot,
      delivery_date: deliveryDate,
      delivery_notes: form.notes,
      locale,
      subtotal,
      subtotal_aed: subtotal,
      vat,
      vat_aed: vat,
      delivery_fee: deliveryFee,
      delivery_fee_aed: deliveryFee,
      promo_code: appliedPromoCode,
      promo_discount: promoDiscount,
      promo_discount_aed: promoDiscount,
      points_redeemed: pointsRedeemed,
      points_value_aed: pointsValueAed,
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

    const { data: inserted, error } = await supabase
      .from('orders')
      .insert(payload)
      .select('id')
      .single()
    if (error || !inserted) throw error ?? new Error('Order insert returned no row')
    const orderId: number = inserted.id

    // Seed the per-order timeline with the initial 'pending' transition.
    // Best-effort — a missing row would just mean the tracking page starts
    // its timeline from the first admin status change instead of placement.
    await supabase
      .from('order_status_history')
      .insert({ order_id: orderId, status: 'pending', actor_email: 'system' })
      .then(() => undefined, err => logError('orders.status_history_seed', err, { reqId, orderId }))

    // ── Record the loyalty-points debit ───────────────────────────────────
    // Done AFTER the order insert so we never debit a customer for an
    // order that never got created.
    if (redeemingCustomerId && pointsRedeemed > 0) {
      await recordRedemption(supabase, {
        customerId: redeemingCustomerId,
        orderId,
        points: pointsRedeemed,
        aed: pointsValueAed,
        orderNumber,
      })
    }

    // ── Customer-attached side effects (referral + cart clear) ────────────
    // Both need the customer id; resolve once and run both. Best-effort —
    // failures here never block the order itself.
    const customerId: number | null = redeemingCustomerId
      ?? (await getCurrentCustomer())?.id
      ?? null
    if (customerId) {
      const referralCode = request.headers.get('cookie')?.split(';')
        .map(s => s.trim())
        .find(s => s.startsWith(`${REFERRAL_COOKIE}=`))?.split('=')[1]
      if (referralCode) {
        await recordReferralOnFirstOrder(supabase, {
          referralCode: decodeURIComponent(referralCode),
          referredCustomerId: customerId,
          orderId,
        })
      }
      // Clear the server-side cart snapshot so the abandonment cron doesn't
      // email a customer who just bought. The local cart is cleared by the
      // checkout flow itself.
      await clearCustomerCart(supabase, customerId)
    }

    // ── Card payment: redirect to Stripe; fulfilment happens in the webhook ─
    if (isCardPayment) {
      const stripe = getStripe()
      if (!stripe) {
        return NextResponse.json(
          { success: false, error: 'Online card payment is not available right now. Please choose Cash on Delivery.' },
          { status: 503 },
        )
      }

      // We send a single line item totalling the exact server-computed amount.
      // Breaking the order into per-product lines (plus a VAT+delivery+promo
      // adjustment) trips a rounding/edge-case bug: when the promo exceeds
      // VAT + delivery the adjustment line would go negative, which Stripe
      // rejects. A single line is less pretty on the receipt but always
      // matches the order total exactly. The itemised breakdown lives in the
      // confirmation email and on /dashboard/orders.
      const itemsSummary = lineItems
        .map((i) => `${i.name} ×${i.quantity}`)
        .join(', ')
        .slice(0, 500)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        // Apple Pay / Google Pay are presented automatically by Stripe Checkout
        // when the browser supports them and the merchant origin is verified —
        // they live under the `card` payment method type and need no extra
        // config here, but we pin the list so future Stripe additions don't
        // surprise customers at checkout.
        payment_method_types: ['card'],
        // Make the order number visible on the cardholder statement (Stripe
        // truncates / sanitises this to 22 chars).
        payment_intent_data: {
          description: `TM FoodStuff order ${orderNumber}`,
          statement_descriptor_suffix: orderNumber.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 22),
        },
        // Save the customer's email + phone (if entered) so Stripe Dashboard
        // shows the right contact when reconciling.
        customer_email: email || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'aed',
              unit_amount: Math.round(total * 100),
              product_data: {
                name: `TM FoodStuff order ${orderNumber}`,
                description: itemsSummary,
              },
            },
          },
        ],
        metadata: {
          order_id: String(orderId),
          order_number: orderNumber,
          locale,
        },
        success_url: `${SITE_URL}/checkout/success?order=${orderNumber}`,
        cancel_url: `${SITE_URL}/checkout?cancelled=${orderNumber}`,
      })

      return NextResponse.json({
        success: true,
        orderNumber,
        stripeUrl: session.url,
        paymentMethod: 'card',
      })
    }

    // ── Cash on Delivery: fulfil inline ────────────────────────────────────
    await fulfillOrder({
      supabase,
      orderNumber,
      customer: { name: fullName, phone: normalisedPhone, email: email || undefined },
      delivery: {
        emirate,
        area,
        building: form.building || undefined,
        slot: deliverySlot,
        notes: form.notes || undefined,
      },
      totals: { subtotal, vat, deliveryFee, promoCode: appliedPromoCode || undefined, promoDiscount, total },
      lineItems,
      locale,
      whatsappNumber,
      paidOnline: false,
      decrementStock: true,
    })

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
        `💳 Cash on Delivery\n` +
        (form.notes ? `📝 Notes: ${form.notes}` : ''),
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
      paymentMethod: 'cod',
    })
  } catch (error) {
    logError('orders', error, { reqId, request })
    return NextResponse.json(
      { success: false, error: 'Could not place your order. Please try again.', reqId },
      { status: 500 },
    )
  }
}
