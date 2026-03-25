export interface Product {
  id: string
  name: string
  nameAr?: string
  slug: string
  category: Category | string
  description?: string
  priceAED: number
  unit: 'kg' | 'g' | 'piece' | 'bunch' | 'box' | 'pack'
  stock: number
  images?: Array<{ image: { url: string; alt?: string } }>
  isFeatured?: boolean
  isOrganic?: boolean
  isActive?: boolean
  origin?: string
}

export interface Category {
  id: string
  name: string
  nameAr?: string
  slug: string
  description?: string
  emoji?: string
  image?: { url: string; alt?: string }
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: OrderItem[]
  subtotalAED: number
  vatAED: number
  deliveryFeeAED: number
  totalAED: number
  deliveryAddress: DeliveryAddress
  paymentMethod: 'telr' | 'cod'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  notes?: string
  createdAt: string
}

export interface OrderItem {
  product: string | Product
  productName: string
  quantity: number
  priceAED: number
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  building?: string
  street?: string
  area: string
  emirate: 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Ajman' | 'Ras Al Khaimah' | 'Fujairah' | 'Umm Al Quwain'
  makani?: string
}
