# 🇦🇪 UAE Market Guide

Everything you need to know to run TMFoodStuff as a compliant, UAE-native e-commerce operation.

---

## AED Currency Setup

All prices in TMFoodStuff are stored and displayed in **UAE Dirhams (AED)**. The currency is hard-coded throughout the app — there's no multi-currency complexity to manage.

### In Code

The `formatAED()` utility in `src/lib/utils.ts` formats prices:

```typescript
formatAED(12.5) // → "AED 12.50"
```

### Product Pricing

When adding products in the Payload admin, the `priceAED` field accepts decimal values. Always enter the full price **inclusive of VAT** for display to customers, then let the system break it down at checkout.

---

## 5% VAT — FTA Compliance

The UAE Federal Tax Authority (FTA) mandates 5% VAT on most goods including food (some staples are zero-rated, but fresh produce sold commercially is standard-rated).

### How TMFoodStuff Handles VAT

VAT is calculated at checkout using the utility functions in `src/lib/utils.ts`:

```typescript
export const VAT_RATE = 0.05

export function calculateVAT(subtotal: number): number {
  return parseFloat((subtotal * VAT_RATE).toFixed(2))
}
```

The checkout page shows the VAT breakdown line-by-line:
- Subtotal (ex-VAT)
- VAT (5%)
- Delivery fee
- **Total (inc. VAT)**

### FTA Registration

To legally collect VAT in the UAE, you must be registered with the FTA:

1. Register at [https://eservices.tax.gov.ae](https://eservices.tax.gov.ae)
2. Obtain your **Tax Registration Number (TRN)**
3. Add your TRN to receipts and invoices — update the Footer component to display it:
   ```tsx
   <span>TRN: 100XXXXXXXXXX</span>
   ```
4. File VAT returns quarterly (or monthly if turnover > AED 150M)

Threshold for mandatory registration: **AED 375,000 annual taxable supplies**.

---

## Telr Payment Gateway

[Telr](https://telr.com) is the UAE's leading payment gateway, licensed by the UAE Central Bank. It supports Visa, Mastercard, AMEX, and local payment methods.

### Step 1: Create a Telr Account

1. Go to [https://telr.com/sign-up](https://telr.com/sign-up)
2. Select **UAE** as your country
3. Provide your business details:
   - Trade license number
   - Emirates ID of owner
   - Bank account in UAE (for payouts)
4. Telr reviews and approves accounts (typically 2–5 business days)

### Step 2: Get API Credentials

Once approved, log into [https://secure.telr.com](https://secure.telr.com):

1. Go to **Settings** → **API**
2. Note your:
   - **Store ID** (e.g., `12345`)
   - **Auth Key** (e.g., `abc123xyz`)
3. Add a test store for sandbox testing

### Step 3: Add to Environment Variables

```env
TELR_STORE_ID=12345
TELR_AUTH_KEY=abc123xyz
TELR_TEST_MODE=true   # Set to false in production
```

### Step 4: Implement Telr Checkout

Telr uses a hosted payment page (HPP). The flow is:

1. Your server calls Telr API to create a payment session
2. Customer is redirected to Telr's secure page
3. After payment, Telr redirects back to your `return_url` with success/failure

Create `app/src/app/api/payment/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orderNumber, totalAED, customerEmail } = await req.json()

  const response = await fetch('https://secure.telr.com/gateway/order.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'create',
      store: process.env.TELR_STORE_ID,
      authkey: process.env.TELR_AUTH_KEY,
      order: {
        cartid: orderNumber,
        test: process.env.TELR_TEST_MODE === 'true' ? 1 : 0,
        amount: totalAED.toFixed(2),
        currency: 'AED',
        description: `TMFoodStuff Order ${orderNumber}`,
      },
      return: {
        authorised: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/success`,
        declined: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/failed`,
        cancelled: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout`,
      },
      customer: {
        email: customerEmail,
      },
    }),
  })

  const data = await response.json()
  return NextResponse.json({ url: data.order?.url })
}
```

---

## Delivery Zones Configuration

TMFoodStuff delivers across all 7 UAE emirates. The `Orders` collection stores the emirate as a select field.

### Delivery Fee Logic

Current configuration in `src/lib/utils.ts`:
- Orders **above AED 150**: Free delivery
- Orders **below AED 150**: AED 10 flat fee

Adjust these constants to match your actual logistics costs:

```typescript
export const FREE_DELIVERY_THRESHOLD = 150  // AED
export const DELIVERY_FEE = 10              // AED
```

### Per-Emirate Delivery Rules

You may want different fees or lead times per emirate. Consider extending the logic:

```typescript
const EMIRATE_DELIVERY_FEES: Record<string, number> = {
  'Dubai': 10,
  'Abu Dhabi': 15,
  'Sharjah': 12,
  'Ajman': 12,
  'Ras Al Khaimah': 20,
  'Fujairah': 25,
  'Umm Al Quwain': 15,
}
```

---

## Makani Address Format

**Makani** (معكاني) is Dubai's digital address system — a unique 10-digit number that pinpoints any location in Dubai to within 3 meters.

Every building and villa in Dubai has a Makani number. Customers can find theirs via the **Makani app** (available on iOS/Android) or on the building directory.

The checkout form includes an optional **Makani Number** field. When provided, your delivery drivers can use the Makani app or Dubai Maps to navigate precisely.

**Implementation note:** The `deliveryAddress.makani` field in the Orders collection stores this. Display it prominently on order confirmation emails and the admin order view so drivers can use it.

---

## WhatsApp Business API for Order Notifications

UAE customers expect WhatsApp communications. Set up automated order notifications:

### Option 1: Twilio WhatsApp API (Recommended)

1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Apply for WhatsApp Business API approval (requires Facebook Business Manager)
3. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` to your `.env`
4. Send order confirmations from a Payload afterChange hook:

```typescript
// In Orders collection
hooks: {
  afterChange: [async ({ doc, operation }) => {
    if (operation === 'create') {
      await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          to: doc.customerPhone,
          message: `✅ Order #${doc.orderNumber} confirmed! Total: AED ${doc.totalAED}. We'll deliver to ${doc.deliveryAddress.area}, ${doc.deliveryAddress.emirate}.`
        })
      })
    }
  }]
}
```

### Option 2: WhatsApp Cloud API (Free, Meta)

1. Create a Meta Business account at [https://business.facebook.com](https://business.facebook.com)
2. Set up a WhatsApp Business Platform app at [https://developers.facebook.com](https://developers.facebook.com)
3. Verify your phone number
4. Use the Messages API directly (free up to 1,000 conversations/month)

---

## Legal Requirements Summary

| Requirement | Action |
|------------|--------|
| VAT Registration | Register at eservices.tax.gov.ae if turnover > AED 375K |
| Trade License | Required to operate e-commerce in UAE |
| Payment Gateway | Use UAE Central Bank licensed gateway (Telr ✓) |
| Data Protection | Comply with UAE PDPL (Personal Data Protection Law) |
| Consumer Protection | UAE Federal Law No. 15 of 2020 applies |
| Price Display | Must show AED prices inclusive of VAT |
