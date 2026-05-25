// Schema for POST /api/orders body.
//
// We keep field-level rules loose enough that the legacy handler stays
// compatible (the server still re-validates phone format / address
// length / promo / stock at run time), but tight enough to reject
// junk early: wrong types, missing required fields, non-numeric
// quantities, etc.
import { z } from 'zod'

export const OrderFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  phone: z.string().trim().min(1, 'Phone is required').max(40),
  email: z.string().trim().max(160).optional().default(''),
  emirate: z.string().trim().min(1, 'Emirate is required').max(60),
  area: z.string().trim().min(1, 'Area is required').max(200),
  building: z.string().trim().max(200).optional().default(''),
  makani: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  // The handler also receives deliverySlot/deliveryDate at the top level;
  // these duplicates exist for back-compat with older client builds.
  deliverySlot: z.string().trim().max(40).optional().default(''),
  deliveryDate: z.string().trim().max(20).optional().default(''),
})

export const OrderItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  quantity: z.coerce.number().int().min(1).max(1000),
}).passthrough() // allow extra fields like name/price/imageUrl from the client snapshot

export const OrderBodySchema = z.object({
  form: OrderFormSchema,
  items: z.array(OrderItemSchema).min(1, 'Cart is empty'),
  paymentMethod: z.enum(['cod', 'card']).default('cod'),
  promoCode: z.string().trim().max(40).optional().default(''),
  pointsToRedeem: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  deliverySlot: z.string().trim().min(1, 'Pick a delivery slot').max(40),
  deliveryDate: z.string().trim().min(1, 'Pick a delivery date').max(20),
  locale: z.string().max(8).optional(),
  // Client also sends precomputed totals (subtotal/vat/total/etc) for
  // optimistic UI — server recomputes from DB, so we accept-and-ignore.
}).passthrough()

export type OrderBody = z.infer<typeof OrderBodySchema>
