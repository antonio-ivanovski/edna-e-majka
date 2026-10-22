import { Effect } from 'effect'
import { and, asc, eq, or, sql } from 'drizzle-orm'

import { Db } from '../services/db'
import { type DatabaseError } from '../errors'
import { product, store } from '../db/schema'

export type StoreSummary = {
  id: string
  name: string
  description: string
  avatarKey: string | null
  coverKey: string | null
  city: string | null
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

const publishedProductCount = sql<number>`(
  select count(*) from ${product}
  where ${product.storeId} = ${store.id} and ${product.status} = 'published'
)`

export const selectStores = Effect.fn('selectStores')(function* (): Effect.fn.Return<
  StoreSummary[],
  DatabaseError,
  Db
> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
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
      .orderBy(asc(store.name)),
  )
  return rows
})

export const selectStoreDetail = Effect.fn('selectStoreDetail')(function* (
  storeId: string,
): Effect.fn.Return<StoreDetail | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
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
      .where(and(or(eq(store.id, storeId), eq(store.slug, storeId)), eq(store.status, 'active')))
      .limit(1),
  )
  const row = rows[0]
  if (!row) return null
  return row
})
