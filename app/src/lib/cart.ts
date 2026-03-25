export interface CartItem {
  id: string
  name: string
  slug: string
  priceAED: number
  unit: string
  quantity: number
  imageUrl?: string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('tmfoodstuff_cart') || '[]')
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem('tmfoodstuff_cart', JSON.stringify(items))
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1): CartItem[] {
  const cart = getCart()
  const existing = cart.find(i => i.id === item.id)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.push({ ...item, quantity: qty })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(id: string): CartItem[] {
  const cart = getCart().filter(i => i.id !== id)
  saveCart(cart)
  return cart
}

export function updateQuantity(id: string, qty: number): CartItem[] {
  const cart = getCart()
  const item = cart.find(i => i.id === id)
  if (item) item.quantity = qty
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  saveCart([])
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.priceAED * item.quantity, 0)
}
