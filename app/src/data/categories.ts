export interface CategoryData {
  id: string
  name: string
  nameAr: string
  slug: string
  description: string
  emoji: string
  color: string
  productCount?: number
}

export const categories: CategoryData[] = [
  {
    id: 'cat-fruits',
    name: 'Fruits',
    nameAr: 'فواكه',
    slug: 'fruits',
    description: 'Fresh fruits sourced from local farms and international orchards',
    emoji: '🍎',
    color: 'bg-red-50',
  },
  {
    id: 'cat-vegetables',
    name: 'Vegetables',
    nameAr: 'خضروات',
    slug: 'vegetables',
    description: 'Farm fresh vegetables delivered daily',
    emoji: '🥦',
    color: 'bg-green-50',
  },
  {
    id: 'cat-organic',
    name: 'Organic',
    nameAr: 'عضوي',
    slug: 'organic',
    description: 'Certified organic produce, free from pesticides',
    emoji: '🌱',
    color: 'bg-emerald-50',
  },
  {
    id: 'cat-exotic',
    name: 'Exotic Fruits',
    nameAr: 'فواكه غريبة',
    slug: 'exotic',
    description: 'Rare and exotic fruits from around the world',
    emoji: '🥭',
    color: 'bg-yellow-50',
  },
]
