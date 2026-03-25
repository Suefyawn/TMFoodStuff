import { defineType, defineField } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name (English)', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'nameAr', title: 'Name (Arabic)', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'isActive', title: 'Is Active', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'name', media: 'heroImage' } },
})
