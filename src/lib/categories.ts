import { z } from 'zod'

/**
 * Categories are application content, not database rows: they change with a
 * deploy and products join them by slug through `product_category`.
 *
 * Titles are Macedonian because visitors read them; slugs are English because
 * they appear in URLs and code.
 */
export const CATEGORY_SLUGS = [
  'honey',
  'bee-products',
  'jams-jelly',
  'spreads',
  'pasta',
  'mushrooms',
  'forest-products',
  'fruits',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

const CATEGORY_TITLES: Record<CategorySlug, string> = {
  honey: 'Мед',
  'bee-products': 'Пчелни производи',
  'jams-jelly': 'Џемови и слатко',
  spreads: 'Намази',
  pasta: 'Тестенини',
  mushrooms: 'Печурки',
  'forest-products': 'Шумски производи',
  fruits: 'Овошје',
}

export type Category = {
  slug: CategorySlug
  title: string
  icon: string
}

export const CATEGORIES: readonly Category[] = CATEGORY_SLUGS.map((slug) => ({
  slug,
  title: CATEGORY_TITLES[slug],
  // The icons the legacy app shipped, kept as they are.
  icon: `/assets/category-icons/${slug}.svg`,
}))

export const categorySlugSchema = z.enum(CATEGORY_SLUGS)

export function findCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug)
}

export function categoryTitle(slug: CategorySlug): string {
  return CATEGORY_TITLES[slug]
}
