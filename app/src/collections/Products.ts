import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'priceAED', 'stock', 'isActive'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'nameAr', type: 'text', label: 'Name (Arabic)' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'descriptionAr', type: 'textarea', label: 'Description (Arabic)' },
    { name: 'priceAED', type: 'number', required: true, label: 'Price (AED)', min: 0 },
    { name: 'unit', type: 'select', options: ['kg', 'g', 'piece', 'bunch', 'box', 'pack'], defaultValue: 'kg' },
    { name: 'stock', type: 'number', defaultValue: 0, min: 0 },
    { name: 'images', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media' }] },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    { name: 'isOrganic', type: 'checkbox', defaultValue: false },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
    { name: 'origin', type: 'text', label: 'Country of Origin' },
    { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text' }] },
  ],
}

