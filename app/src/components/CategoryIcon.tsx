import { Apple, Carrot, Sprout, Gift, Cherry, Leaf } from 'lucide-react'

// Crisp icon stand-in for the legacy category `emoji` field. Slugs come from
// the categories table; anything unmapped (new subcategories) falls back to a
// neutral Leaf so the UI never shows a raw emoji or an empty gap.
const ICONS: Record<string, typeof Apple> = {
  fruits: Apple,
  vegetables: Carrot,
  organic: Sprout,
  gifts: Gift,
  exotic: Cherry,
}

export default function CategoryIcon({
  slug,
  size = 13,
  className,
}: {
  slug?: string | null
  size?: number
  className?: string
}) {
  const Icon = (slug && ICONS[slug]) || Leaf
  return <Icon size={size} className={className} aria-hidden="true" />
}
