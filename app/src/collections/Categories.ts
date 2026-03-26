import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'nameAr', type: 'text', label: 'Name (Arabic)' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'emoji', type: 'text', label: 'Emoji icon' },
    { name: 'parent', type: 'relationship', relationTo: 'categories', label: 'Parent Category' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

