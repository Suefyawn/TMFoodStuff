// Schemas for /api/dashboard/products POST + PATCH.
//
// The legacy handler accepts both camelCase and snake_case for several
// fields (priceAED ↔ price_aed, isActive ↔ is_active) — the schema
// captures both via .transform so the handler can read a single
// canonical shape.
import { z } from 'zod'

const StringArray = z.array(z.string().trim().max(1024)).max(20)

// Shared field rules — used by both create + update.
const baseProductShape = {
  name: z.string().trim().min(1, 'Product name is required').max(200),
  name_ar: z.string().trim().max(200).optional().default(''),
  slug: z.string().trim().min(1, 'Slug is required').max(160).regex(
    /^[a-z0-9][a-z0-9-]*$/,
    'Slug must be lowercase letters, numbers, and dashes only',
  ),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().trim().max(4000).optional().default(''),
  price_aed: z.coerce.number().nonnegative('Price must be 0 or greater').max(100_000),
  unit: z.string().trim().max(20).optional().default('kg'),
  stock: z.coerce.number().int().nonnegative('Stock must be 0 or greater').max(1_000_000).optional().default(0),
  compare_at_price_aed: z.coerce.number().nonnegative().max(100_000).optional().nullable(),
  is_organic: z.coerce.boolean().optional().default(false),
  is_featured: z.coerce.boolean().optional().default(false),
  is_active: z.coerce.boolean().optional().default(true),
  origin: z.string().trim().max(120).optional().default(''),
  emoji: z.string().trim().max(8).optional().default(''),
  image_url: z.string().trim().max(1024).optional().nullable(),
  image_urls: StringArray.optional(),
}

export const ProductCreateSchema = z.object(baseProductShape)
export type ProductCreate = z.infer<typeof ProductCreateSchema>

// PATCH accepts the same shape but every field is optional, and we tolerate
// the camelCase aliases the legacy client still emits.
export const ProductUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  // Allow camelCase aliases coming from older client code; normalise them
  // back to snake_case in the handler so the DB mapping has one shape.
  priceAED: z.coerce.number().nonnegative().max(100_000).optional(),
  isActive: z.coerce.boolean().optional(),
  // Snake-case canonical fields, all optional.
  name: baseProductShape.name.optional(),
  name_ar: baseProductShape.name_ar,
  slug: baseProductShape.slug.optional(),
  category_id: baseProductShape.category_id,
  description: baseProductShape.description,
  price_aed: baseProductShape.price_aed.optional(),
  unit: baseProductShape.unit,
  stock: baseProductShape.stock,
  compare_at_price_aed: baseProductShape.compare_at_price_aed,
  is_organic: baseProductShape.is_organic,
  is_featured: baseProductShape.is_featured,
  is_active: baseProductShape.is_active,
  origin: baseProductShape.origin,
  emoji: baseProductShape.emoji,
  image_url: baseProductShape.image_url,
  image_urls: baseProductShape.image_urls,
}).passthrough()
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>

export const ProductDeleteSchema = z.object({
  ids: z.union([
    z.coerce.number().int().positive(),
    z.array(z.coerce.number().int().positive()).min(1).max(500),
  ]),
})
export type ProductDelete = z.infer<typeof ProductDeleteSchema>
