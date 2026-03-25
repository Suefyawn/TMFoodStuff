import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 768, height: 768, position: 'centre' },
    ],
    mimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'],
  },
  fields: [{ name: 'alt', type: 'text' }],
}
