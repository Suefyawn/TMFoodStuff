import { defineType, defineField } from 'sanity'

export const banner = defineType({
  name: 'banner',
  title: 'Homepage Banner',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title (English)', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'titleAr', title: 'Title (Arabic)', type: 'string' }),
    defineField({ name: 'subtitle', title: 'Subtitle (English)', type: 'string' }),
    defineField({ name: 'subtitleAr', title: 'Subtitle (Arabic)', type: 'string' }),
    defineField({ name: 'image', title: 'Banner Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'ctaText', title: 'CTA Button Text', type: 'string' }),
    defineField({ name: 'ctaLink', title: 'CTA Link', type: 'string' }),
    defineField({ name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  preview: { select: { title: 'title', media: 'image' } },
})
