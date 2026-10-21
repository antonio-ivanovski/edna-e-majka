import { Effect } from 'effect'
import { eq, inArray } from 'drizzle-orm'

import { env } from 'cloudflare:workers'
import { Db } from './services/db'
import { type DatabaseError, StorageError } from './errors'
import { product, productCategory, productImage, productVariant, contactMessage, store } from './db/schema'

export const deleteProductCascade = Effect.fn('deleteProductCascade')(function* (productId: string): Effect.fn.Return<void, DatabaseError | StorageError, Db> {
  const db = yield* Db
  const images = yield* db.run((d) => d.select({ r2Key: productImage.r2Key }).from(productImage).where(eq(productImage.productId, productId)))
  if (images.length > 0) {
    yield* Effect.tryPromise({
      try: () => env.BUCKET.delete(images.map((i) => i.r2Key)),
      catch: (cause) => new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
    })
  }
  yield* db.run((d) => d.delete(productImage).where(eq(productImage.productId, productId))).pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(productVariant).where(eq(productVariant.productId, productId))).pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(productCategory).where(eq(productCategory.productId, productId))).pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(product).where(eq(product.id, productId))).pipe(Effect.asVoid)
})

export const deleteStoreCascade = Effect.fn('deleteStoreCascade')(function* (storeId: string): Effect.fn.Return<void, DatabaseError | StorageError, Db> {
  const db = yield* Db
  const ownStore = yield* db.run((d) => d.select({ avatarKey: store.avatarKey, coverKey: store.coverKey }).from(store).where(eq(store.id, storeId)).limit(1))
  const rows = yield* db.run((d) => d.select({ id: product.id }).from(product).where(eq(product.storeId, storeId)))
  const productIds = rows.map((r) => r.id)
  if (productIds.length > 0) {
    const images = yield* db.run((d) => d.select({ r2Key: productImage.r2Key }).from(productImage).where(inArray(productImage.productId, productIds)))
    if (images.length > 0) {
      yield* Effect.tryPromise({
        try: () => env.BUCKET.delete(images.map((i) => i.r2Key)),
        catch: (cause) => new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
      })
    }
    yield* db.run((d) => d.delete(productImage).where(inArray(productImage.productId, productIds))).pipe(Effect.asVoid)
    yield* db.run((d) => d.delete(productVariant).where(inArray(productVariant.productId, productIds))).pipe(Effect.asVoid)
    yield* db.run((d) => d.delete(productCategory).where(inArray(productCategory.productId, productIds))).pipe(Effect.asVoid)
    yield* db.run((d) => d.delete(product).where(inArray(product.id, productIds))).pipe(Effect.asVoid)
  }
  const keys = [ownStore[0]?.avatarKey, ownStore[0]?.coverKey].filter((k): k is string => typeof k === 'string' && k.length > 0)
  if (keys.length > 0) {
    yield* Effect.tryPromise({
      try: () => env.BUCKET.delete(keys),
      catch: (cause) => new StorageError({ message: 'Не успеавме да ги избришеме сликите.', cause }),
    })
  }
  yield* db.run((d) => d.update(contactMessage).set({ storeId: null }).where(eq(contactMessage.storeId, storeId))).pipe(Effect.asVoid)
  yield* db.run((d) => d.delete(store).where(eq(store.id, storeId))).pipe(Effect.asVoid)
})
