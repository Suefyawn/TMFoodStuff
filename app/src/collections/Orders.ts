import { CollectionConfig } from 'payload/types'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'totalAED', 'status', 'createdAt'],
  },
  fields: [
    { name: 'orderNumber', type: 'text' },
    { name: 'customer', type: 'relationship', relationTo: 'customers' },
    { name: 'customerName', type: 'text' },
    { name: 'customerPhone', type: 'text' },
    { name: 'customerEmail', type: 'email' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'productName', type: 'text' },
        { name: 'quantity', type: 'number' },
        { name: 'priceAED', type: 'number' },
      ],
    },
    { name: 'subtotalAED', type: 'number' },
    { name: 'vatAED', type: 'number', label: 'VAT (5%) AED' },
    { name: 'deliveryFeeAED', type: 'number' },
    { name: 'totalAED', type: 'number' },
    {
      name: 'deliveryAddress',
      type: 'group',
      fields: [
        { name: 'fullName', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'building', type: 'text' },
        { name: 'street', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'emirate', type: 'select', options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'] },
        { name: 'makani', type: 'text', label: 'Makani Number' },
      ],
    },
    { name: 'paymentMethod', type: 'select', options: ['telr', 'cod'] },
    { name: 'paymentStatus', type: 'select', options: ['pending', 'paid', 'failed', 'refunded'], defaultValue: 'pending' },
    { name: 'status', type: 'select', options: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'], defaultValue: 'pending' },
    { name: 'notes', type: 'textarea' },
  ],
}
