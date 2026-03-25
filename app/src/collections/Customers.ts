import { CollectionConfig } from 'payload/types'

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'phone', type: 'text' },
    {
      name: 'savedAddresses',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'building', type: 'text' },
        { name: 'street', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'emirate', type: 'select', options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'] },
      ],
    },
  ],
}
