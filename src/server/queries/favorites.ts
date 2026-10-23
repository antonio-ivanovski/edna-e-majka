import { Effect } from 'effect'
import { and, asc, eq } from 'drizzle-orm'

import { Db } from '../services/db'
import { type DatabaseError } from '../errors'
import { favoriteProduct, storeFollower } from '../db/schema'
import { store } from '../db/schema'
import { selectProductSummaries, type ProductSummary } from './products'
import { storeSummaryColumns, type StoreSummary } from './stores'

/** The signed-in person's saved products, newest first. */
export const selectFavoriteProducts = Effect.fn('selectFavoriteProducts')(function* (
  userId: string,
): Effect.fn.Return<ProductSummary[], DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select({ productId: favoriteProduct.productId })
      .from(favoriteProduct)
      .where(eq(favoriteProduct.userId, userId)),
  )

  if (rows.length === 0) return []

  return yield* selectProductSummaries(rows.map((row) => row.productId))
})

/** The shops the signed-in person follows, by name. */
export const selectFollowedStores = Effect.fn('selectFollowedStores')(function* (
  userId: string,
): Effect.fn.Return<StoreSummary[], DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select(storeSummaryColumns)
      .from(store)
      .innerJoin(
        storeFollower,
        and(eq(storeFollower.storeId, store.id), eq(storeFollower.userId, userId)),
      )
      .where(eq(store.status, 'active'))
      .orderBy(asc(store.name)),
  )

  return rows
})
