# 🇦🇪 UAE Market Specifics — TMFoodStuff

This document covers all UAE-specific requirements for the TMFoodStuff e-commerce platform.

---

## Currency: AED (UAE Dirham)

- **Symbol:** AED / د.إ
- **Smallest unit in Medusa:** 1 fil = 0.01 AED (100 fils = 1 AED)
- All prices stored internally in **fils** (like cents in USD)
- Display format: `AED 12.50` or `د.إ 12.50`
- Use `Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' })` for formatting

```ts
// storefront/src/lib/utils.ts
export function formatAED(amountInFils: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amountInFils / 100) // Convert fils → AED
}
```

---

## VAT — 5% UAE Federal VAT

- **Rate:** 5% (as per UAE Federal Tax Authority)
- **Mandatory:** Must be shown separately on invoices and at checkout
- **Tax Registration Number (TRN):** Must be displayed in footer/invoices
- **Medusa setup:** Create a Tax Rate of 5% under the UAE region
- VAT must be applied to all products sold in UAE

### Medusa Tax Rate Setup (Admin)
1. Medusa Admin → Settings → Regions → UAE
2. Add Tax Rate: `UAE VAT` → `5%` → Code: `UAE-VAT`
3. Ensure it applies to all product categories

### Invoice Requirements (FTA)
- Supplier name and TRN
- Customer name and address
- Invoice date
- Item descriptions with unit prices
- Tax amount (5% VAT) shown separately
- Total amount (inclusive and exclusive of VAT)

---

## Payment Gateways

### Telr
- **Website:** https://telr.com
- **Coverage:** UAE, Saudi Arabia, and wider MENA
- **Supported cards:** Visa, Mastercard, Amex, mada
- **Features:** 3D Secure, recurring payments, installments
- **Integration:** REST API + Medusa payment plugin
- **Account:** Requires UAE trade license

### PayTabs
- **Website:** https://paytabs.com
- **Coverage:** UAE and GCC
- **Supported:** Visa, Mastercard, mada, KNET, Apple Pay
- **Features:** Hosted payment page, split payments
- **Integration:** REST API + Medusa payment plugin
- **Account:** UAE business registration required

> ⚠️ Both gateways require a **UAE trade license** and bank account for merchant onboarding.

---

## RTL (Right-to-Left) Arabic Support

### Implementation
- Use `next-intl` for i18n routing (EN + AR locales)
- Set `dir="rtl"` on `<html>` for Arabic
- Cairo font for Arabic text (loaded via Google Fonts)

```tsx
// layout.tsx — RTL toggle based on locale
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

### Tailwind RTL
Tailwind CSS v3 supports `rtl:` variants:
```html
<div class="text-left rtl:text-right">
  <!-- Left-aligned in LTR, right-aligned in RTL -->
</div>
```

### Arabic Font
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

[dir='rtl'] body {
  font-family: 'Cairo', sans-serif;
}
```

---

## WhatsApp Business

WhatsApp is the **de facto** communication channel in UAE for:
- Order confirmations
- Delivery updates
- Customer support

### Setup
1. Register a **WhatsApp Business** account with a UAE number (+971)
2. Apply for **WhatsApp Business API** via an official BSP (Business Solution Provider)
   - Recommended: Twilio, 360dialog, or Vonage
3. Send templated messages for order events

### Message Templates (FTA-compliant)
```
Order Confirmation: "Hello {name}! Your order #{id} has been confirmed. Total: AED {amount} (incl. 5% VAT). Estimated delivery: {date}."

Delivery Update: "Your TMFoodStuff order #{id} is out for delivery! Track: {link}"
```

---

## Delivery Zones

| Emirate | Typical Delivery Time | Notes |
|---------|----------------------|-------|
| Dubai | Same day / Next day | Largest market |
| Abu Dhabi | Next day | High demand |
| Sharjah | Same day | Close to Dubai warehouses |
| Ajman | Next day | — |
| Ras Al Khaimah | 1–2 days | Northern UAE |
| Fujairah | 1–2 days | East coast |
| Umm Al Quwain | 1–2 days | Smaller market |

---

## Timezone

- **Name:** Gulf Standard Time (GST)
- **UTC Offset:** UTC+4
- **No Daylight Saving:** UAE does not observe DST
- **Node.js:** Set `TZ=Asia/Dubai` environment variable

```env
TZ=Asia/Dubai
```

---

## Working Week

- **Standard working week:** Sunday–Thursday (government & many businesses)
- **Weekend:** Friday–Saturday
- **Note:** Many private businesses operate Sunday–Thursday or Monday–Friday
- **Ramadan:** Reduced working hours; may affect delivery schedules
- **National holidays:** Eid Al Fitr, Eid Al Adha, UAE National Day (Dec 2–3)

---

## Food Safety & Compliance

- **Dubai Municipality:** All food businesses must comply with Dubai Municipality food safety regulations
  - Reference: https://www.dm.gov.ae/business/food-safety
- **Abu Dhabi Agriculture & Food Safety Authority (ADAFSA):** For Abu Dhabi operations
- **ESMA (Emirates Authority for Standardization):** UAE product standards
- **Cold chain:** Refrigerated transport required for perishables
- **Halal:** All products must be Halal-certified or clearly labeled
- **Country of origin:** Must be displayed on product listings

---

## Address System

UAE uses several address systems:
1. **Standard:** Building name, street, area, emirate
2. **Makani** (Dubai): 10-digit geo-code (e.g., 21345 67890)
3. **Abu Dhabi Address:** Plot number + zone + street

### Address Form Fields
```ts
interface UAEAddress {
  emirate: Emirate
  area: string        // District / community
  building: string    // Building name or villa number
  floor?: string
  apartment?: string
  street?: string
  makaniNumber?: string  // Dubai-specific
  plusCode?: string      // Google Plus Code (universal)
}
```

---

## Local SEO Notes

- Target keywords in both English and Arabic
- Register on **Google My Business** (maps important in UAE)
- List on **Zomato, Noon**, and **Amazon.ae** as secondary channels
- UAE consumers heavily use **Instagram** for product discovery
