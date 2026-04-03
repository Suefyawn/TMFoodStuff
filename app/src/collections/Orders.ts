import { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'totalAED', 'paymentMethod', 'createdAt'],
    description: 'All customer orders',
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: '🟡 Pending', value: 'pending' },
        { label: '✅ Confirmed', value: 'confirmed' },
        { label: '🔄 Processing', value: 'processing' },
        { label: '🚚 Out for Delivery', value: 'out_for_delivery' },
        { label: '✅ Delivered', value: 'delivered' },
        { label: '❌ Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'Cash on Delivery', value: 'cod' },
        { label: 'Card (Telr)', value: 'telr' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: { position: 'sidebar' },
    },
    // Customer info
    {
      name: 'customer',
      type: 'group',
      label: 'Customer',
      fields: [
        { name: 'fullName', type: 'text', label: 'Full Name' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    // Delivery address
    {
      name: 'delivery',
      type: 'group',
      label: 'Delivery',
      fields: [
        { name: 'emirate', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'building', type: 'text' },
        { name: 'makani', type: 'text', label: 'Makani Number' },
        {
          name: 'slot',
          type: 'select',
          label: 'Delivery Slot',
          options: [
            { label: 'Morning (8AM-12PM)', value: 'morning' },
            { label: 'Afternoon (12PM-5PM)', value: 'afternoon' },
            { label: 'Evening (5PM-10PM)', value: 'evening' },
          ],
        },
        { name: 'notes', type: 'textarea' },
      ],
    },
    // Order items
    {
      name: 'items',
      type: 'array',
      label: 'Order Items',
      fields: [
        { name: 'productId', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'quantity', type: 'number' },
        { name: 'priceAED', type: 'number', label: 'Unit Price (AED)' },
        { name: 'subtotal', type: 'number', label: 'Subtotal (AED)' },
        { name: 'unit', type: 'text' },
      ],
    },
    // Pricing
    {
      name: 'pricing',
      type: 'group',
      label: 'Pricing',
      fields: [
        { name: 'subtotal', type: 'number', label: 'Subtotal (AED)' },
        { name: 'vat', type: 'number', label: 'VAT 5% (AED)' },
        { name: 'deliveryFee', type: 'number', label: 'Delivery Fee (AED)' },
        { name: 'promoCode', type: 'text' },
        { name: 'promoDiscount', type: 'number', label: 'Promo Discount (AED)' },
        { name: 'total', type: 'number', label: 'Total (AED)', required: true },
      ],
    },
    // Computed display field
    { name: 'totalAED', type: 'number', label: 'Total (AED)', admin: { readOnly: true } },
  ],
}
