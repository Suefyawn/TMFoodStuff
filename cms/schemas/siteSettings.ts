import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Site Name', type: 'string', initialValue: 'TMFoodStuff' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({
      name: 'contactWhatsApp',
      title: 'WhatsApp Number (UAE)',
      type: 'string',
      description: 'Format: +971XXXXXXXXX',
    }),
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
    defineField({ name: 'vatNumber', title: 'VAT Registration Number', type: 'string' }),
    defineField({ name: 'address', title: 'Business Address', type: 'text' }),
    defineField({
      name: 'deliveryZones',
      title: 'Delivery Zones',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    }),
  ],
})
