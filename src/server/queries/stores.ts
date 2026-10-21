import { and, asc, eq, or, sql } from 'drizzle-orm'

import { getDb } from '../db/client'
import { product, store } from '../db/schema'

export type StoreSummary = {
  id: string
  name: string
  description: string
  avatarKey: string | null
  coverKey: string | null
  city: string | null
  /** The readable address; null only for rows written before slugs existed. */
  slug: string | null
  createdAt: Date
  productCount: number
}

export type StoreDetail = StoreSummary & {
  email: string
  phone: string
  facebook: string | null
  instagram: string | null
  hours: string | null
}

/** Stores a visitor can order from: active, newest name order for the directory. */
const publishedProductCount = sql<number>`(
  select count(*) from ${product}
  where ${product.storeId} = ${store.id} and ${product.status} = 'published'
)`

export async function selectStores(): Promise<StoreSummary[]> {
  const rows = await getDb()
    .select({
      id: store.id,
      name: store.name,
      description: store.description,
      avatarKey: store.avatarKey,
      coverKey: store.coverKey,
      city: store.city,
      slug: store.slug,
      createdAt: store.createdAt,
      productCount: publishedProductCount,
    })
    .from(store)
    .where(eq(store.status, 'active'))
    .orderBy(asc(store.name))

  return rows
}

export async function selectStoreDetail(storeId: string): Promise<StoreDetail | null> {
  const db = getDb()

  const rows = await db
    .select({
      id: store.id,
      name: store.name,
      description: store.description,
      avatarKey: store.avatarKey,
      coverKey: store.coverKey,
      city: store.city,
      slug: store.slug,
      createdAt: store.createdAt,
      email: store.email,
      phone: store.phone,
      facebook: store.facebook,
      instagram: store.instagram,
      hours: store.hours,
      productCount: publishedProductCount,
    })
    .from(store)
    // The address in the URL may be the id or the slug; both find the shop.
    .where(and(or(eq(store.id, storeId), eq(store.slug, storeId)), eq(store.status, 'active')))
    .limit(1)

  const row = rows[0]

  if (!row) {
    return null
  }

  return row
}
