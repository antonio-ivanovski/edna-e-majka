import { Effect } from 'effect'
import { eq, inArray } from 'drizzle-orm'

import { Db } from './services/db'
import { type DatabaseError, StorageError } from './errors'
import {
  product,
  productCategory,
  productImage,
  productVariant,
  contactMessage,
  store,
} from './db/schema'
import { workerEnv } from './worker-env'

/**
 * D1 caps bound parameters per statement, so a store with hundreds of
 * listings cannot delete everything in one `inArray`. Fifty ids per batch
 * keeps every statement small; the batches run one after another.
 */
function chunks<const Id>(ids: readonly Id[], size: number): Id[][] {
  const out: Id[][] = []
  for (let index = 0; index < ids.length; index += size) {
    out.push(ids.slice(index, index + size))
  }
  return out
}

export const deleteProductCascade = Effect.fn('deleteProductCascade')(function* (
  productId: string,
): Effect.fn.Return<void, DatabaseError | StorageError, Db> {
  const db = yield* Db
  const images = yield* db.run((d) =>
    d
      .select({ r2Key: productImage.r2Key })
      .from(productImage)
      .where(eq(productImage.productId, productId)),
  )
  if (images.length > 0) {
    yield* Effect.tryPromise({
      try: () => workerEnv().BUCKET.delete(images.map((i) => i.r2Key)),
      catch: (cause) =>
        new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
    })
  }
  yield* db
    .run((d) => d.delete(productImage).where(eq(productImage.productId, productId)))
    .pipe(Effect.asVoid)
  yield* db
    .run((d) => d.delete(productVariant).where(eq(productVariant.productId, productId)))
    .pipe(Effect.asVoid)
  yield* db
    .run((d) => d.delete(productCategory).where(eq(productCategory.productId, productId)))
    .pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(product).where(eq(product.id, productId))).pipe(Effect.asVoid)
})

export const deleteStoreCascade = Effect.fn('deleteStoreCascade')(function* (
  storeId: string,
): Effect.fn.Return<void, DatabaseError | StorageError, Db> {
  const db = yield* Db
  const ownStore = yield* db.run((d) =>
    d
      .select({ avatarKey: store.avatarKey, coverKey: store.coverKey })
      .from(store)
      .where(eq(store.id, storeId))
      .limit(1),
  )
  const rows = yield* db.run((d) =>
    d.select({ id: product.id }).from(product).where(eq(product.storeId, storeId)),
  )
  const productIds = rows.map((r) => r.id)
  for (const chunk of chunks(productIds, 50)) {
    const images = yield* db.run((d) =>
      d
        .select({ r2Key: productImage.r2Key })
        .from(productImage)
        .where(inArray(productImage.productId, chunk)),
    )
    if (images.length > 0) {
      yield* Effect.tryPromise({
        try: () => workerEnv().BUCKET.delete(images.map((i) => i.r2Key)),
        catch: (cause) =>
          new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
      })
    }
    yield* db
      .run((d) => d.delete(productImage).where(inArray(productImage.productId, chunk)))
      .pipe(Effect.asVoid)
    yield* db
      .run((d) => d.delete(productVariant).where(inArray(productVariant.productId, chunk)))
      .pipe(Effect.asVoid)
    yield* db
      .run((d) => d.delete(productCategory).where(inArray(productCategory.productId, chunk)))
      .pipe(Effect.asVoid)
    yield* db.run((d) => d.delete(product).where(inArray(product.id, chunk))).pipe(Effect.asVoid)
  }
  const keys = [ownStore[0]?.avatarKey, ownStore[0]?.coverKey].filter(
    (k): k is string => typeof k === 'string' && k.length > 0,
  )
  if (keys.length > 0) {
    yield* Effect.tryPromise({
      try: () => workerEnv().BUCKET.delete(keys),
      catch: (cause) =>
        new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
    })
  }
  yield* db
    .run((d) =>
      d.update(contactMessage).set({ storeId: null }).where(eq(contactMessage.storeId, storeId)),
    )
    .pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(store).where(eq(store.id, storeId))).pipe(Effect.asVoid)
})
