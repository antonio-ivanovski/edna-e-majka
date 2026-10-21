import { asc, count, eq, sql } from 'drizzle-orm'

import { getDb } from '../db/client'
import { product, store } from '../db/schema'

export type StoreSummary = {
  id: string
  name: string
  description: string
  avatarKey: string | null
  createdAt: Date
  productCount: number
}

export type StoreDetail = StoreSummary & {
  email: string
  phone: string
  facebook: string | null
  instagram: string | null
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

  const [rows, productRows] = await db.batch([
    db
      .select({
        id: store.id,
        name: store.name,
        description: store.description,
        avatarKey: store.avatarKey,
        createdAt: store.createdAt,
        email: store.email,
        phone: store.phone,
        facebook: store.facebook,
        instagram: store.instagram,
      })
      .from(store)
      .where(sql`${store.id} = ${storeId} and ${store.status} = 'active'`)
      .limit(1),
    db
      .select({ total: count() })
      .from(product)
      .where(sql`${product.storeId} = ${storeId} and ${product.status} = 'published'`),
  ])

  const row = rows[0]

  if (!row) {
    return null
  }

  return {
    ...row,
    productCount: productRows[0]?.total ?? 0,
  }
}
