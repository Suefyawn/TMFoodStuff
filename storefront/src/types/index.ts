// ============================================
// TMFoodStuff — TypeScript Type Definitions
// ============================================

/** UAE Emirates */
export type Emirate =
  | 'Dubai'
  | 'Abu Dhabi'
  | 'Sharjah'
  | 'Ajman'
  | 'Ras Al Khaimah'
  | 'Fujairah'
  | 'Umm Al Quwain'

/** Product variant price */
export interface Price {
  id: string
  currency_code: string
  amount: number // stored in fils (smallest unit); 1 fil = 0.01 AED
}

/** Product variant */
export interface ProductVariant {
  id: string
  title: string
  sku?: string
  inventory_quantity?: number
  prices: Price[]
}

/** Main product type */
export interface Product {
  id: string
  title: string
  handle: string
  subtitle?: string
  description?: string
  thumbnail?: string
  images?: { id: string; url: string }[]
  variants: ProductVariant[]
  tags?: { id: string; value: string }[]
  created_at: string
  updated_at: string
}

/** Cart line item */
export interface CartItem {
  id: string
  title: string
  description?: string
  quantity: number
  unit_price: number // in fils
  thumbnail?: string
  variant_id: string
  product_id: string
}

/** Shopping cart */
export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number // in fils
  tax_total: number // 5% UAE VAT
  shipping_total: number
  total: number // in fils
  currency_code: string // 'aed'
  region_id: string
  email?: string
  shipping_address?: Address
  billing_address?: Address
}

/** UAE address */
export interface Address {
  id?: string
  first_name: string
  last_name: string
  phone?: string // +971XXXXXXXXX
  address_1: string // Street & building
  address_2?: string // Apartment / villa
  city: string // District / area
  province: Emirate
  postal_code?: string // Not always used in UAE
  country_code: 'ae'
  metadata?: {
    makani_number?: string // Dubai Makani address system
    plus_code?: string // Google Plus Code
    building_name?: string
    floor?: string
  }
}

/** Order */
export interface Order {
  id: string
  display_id: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: CartItem[]
  subtotal: number // in fils
  tax_total: number // UAE VAT 5%
  shipping_total: number
  total: number // in fils
  currency_code: 'aed'
  shipping_address: Address
  billing_address: Address
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

/** Sanity banner type */
export interface Banner {
  _id: string
  title: string
  titleAr?: string
  subtitle?: string
  subtitleAr?: string
  image?: {
    asset: { _ref: string }
    hotspot?: { x: number; y: number }
  }
  ctaText?: string
  ctaLink?: string
  isActive: boolean
  order?: number
}

/** Sanity category */
export interface Category {
  _id: string
  name: string
  nameAr?: string
  slug: { current: string }
  description?: string
  heroImage?: { asset: { _ref: string } }
  isActive: boolean
}
