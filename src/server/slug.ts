/**
 * Slugs are claimed, not chosen: the readable address is written once, when the
 * listing or the shop is created, and then kept so shared links keep working.
 */
import { eq, like, or } from 'drizzle-orm'

import { slugify, uniqueSlug } from '#/lib/slug'

import { getDb } from './db/client'
import { product, store } from './db/schema'

/** A free product slug for the given title. */
export async function claimProductSlug(title: string): Promise<string> {
  const base = slugify(title)
  const db = getDb()

  const rows = await db
    .select({ slug: product.slug })
    .from(product)
    .where(or(eq(product.slug, base), like(product.slug, `${base}-%`)))

  const taken = new Set(rows.map((row) => row.slug).filter((slug): slug is string => !!slug))

  return uniqueSlug(base, (candidate) => taken.has(candidate))
}

/** A free shop slug for the given name. */
export async function claimStoreSlug(name: string): Promise<string> {
  const base = slugify(name)
  const db = getDb()

  const rows = await db
    .select({ slug: store.slug })
    .from(store)
    .where(or(eq(store.slug, base), like(store.slug, `${base}-%`)))

  const taken = new Set(rows.map((row) => row.slug).filter((slug): slug is string => !!slug))

  return uniqueSlug(base, (candidate) => taken.has(candidate))
}
