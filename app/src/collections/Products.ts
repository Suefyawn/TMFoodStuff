import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'priceAED', 'stock', 'isActive'],
    description: 'Product catalog - add, edit, and manage all products',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'nameAr', type: 'text', label: 'Name (Arabic)' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'descriptionAr', type: 'textarea', label: 'Description (Arabic)' },
    { name: 'priceAED', type: 'number', required: true, label: 'Price (AED)', min: 0 },
    { name: 'compareAtPriceAED', type: 'number', label: 'Compare At Price (AED) - for showing discounts' },
    { name: 'unit', type: 'select', options: ['kg', 'g', 'piece', 'bunch', 'box', 'pack'], defaultValue: 'kg' },
    { name: 'stock', type: 'number', defaultValue: 100, min: 0, label: 'Stock Quantity' },
    { name: 'isActive', type: 'checkbox', defaultValue: true, label: 'Active (visible in store)' },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false, label: 'Featured (show in homepage)' },
    { name: 'isOrganic', type: 'checkbox', defaultValue: false, label: 'Organic' },
    { name: 'origin', type: 'text', label: 'Country of Origin' },
    { name: 'emoji', type: 'text', label: 'Emoji icon (e.g. 🍎)' },
    {
      name: 'images',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    { name: 'tags', type: 'text', label: 'Tags (comma separated)' },
  ],
}
