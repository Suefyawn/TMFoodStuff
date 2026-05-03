// Supabase row types — snake_case matches DB columns

export interface DbProduct {
  id: number
  name: string
  name_ar: string
  slug: string
  description: string
  price_aed: number
  unit: string
  stock: number
  is_active: boolean
  is_featured: boolean
  is_organic: boolean
  origin: string
  emoji: string
  image_url: string | null
  category_id: number | null
  created_at: string
  updated_at: string
  categories?: { name: string; slug: string }
}

export interface DbCategory {
  id: number
  name: string
  name_ar: string
  slug: string
  emoji: string
  description: string
  created_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface DbOrder {
  id: number
  order_number: string
  status: OrderStatus
  payment_method: string
  payment_status: string
  customer_name: string
  customer_full_name: string
  customer_phone: string
  customer_email: string
  delivery_emirate: string
  delivery_area: string
  delivery_building: string
  delivery_makani: string
  delivery_slot: string
  delivery_notes: string
  subtotal: number
  subtotal_aed: number
  vat: number
  vat_aed: number
  delivery_fee: number
  delivery_fee_aed: number
  promo_code: string
  promo_discount: number
  promo_discount_aed: number
  total: number
  total_aed: number
  items: DbOrderItem[]
  created_at: string
  updated_at: string
}

export interface DbOrderItem {
  id: string
  name: string
  quantity: number
  price_aed: number
  subtotal: number
  unit: string
}

export interface DbCustomer {
  id: number
  name: string
  phone: string
  email: string
  emirate: string
  area: string
  created_at: string
}

export interface DbPromoCode {
  id: number
  code: string
  discount_percent: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}
