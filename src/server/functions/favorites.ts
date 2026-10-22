import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'

import { toValidator } from '#/api/schemas'
import { Schema } from 'effect'

import { favoriteProduct, favoriteStore, storeFollower } from '../db/schema'
import { getDb } from '../db/client'
import { withViewer } from '../middleware'
import { NotSignedInError } from '../errors'
import type { DomainError } from '../errors'
import { Result } from 'effect'

const productIdSchema = Schema.Struct({
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})
const storeIdSchema = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const toggleFavoriteProduct = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(productIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ favorited: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

      const db = getDb()
      const existing = await db
        .select({ productId: favoriteProduct.productId })
        .from(favoriteProduct)
        .where(
          and(eq(favoriteProduct.userId, viewer.id), eq(favoriteProduct.productId, data.productId)),
        )
        .limit(1)

      if (existing.length > 0) {
        await db
          .delete(favoriteProduct)
          .where(
            and(
              eq(favoriteProduct.userId, viewer.id),
              eq(favoriteProduct.productId, data.productId),
            ),
          )
        return Result.succeed({ favorited: false })
      }

      await db.insert(favoriteProduct).values({ userId: viewer.id, productId: data.productId })
      return Result.succeed({ favorited: true })
    },
  )

export const toggleFavoriteStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(storeIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ favorited: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

      const db = getDb()
      const existing = await db
        .select({ storeId: favoriteStore.storeId })
        .from(favoriteStore)
        .where(and(eq(favoriteStore.userId, viewer.id), eq(favoriteStore.storeId, data.storeId)))
        .limit(1)

      if (existing.length > 0) {
        await db
          .delete(favoriteStore)
          .where(and(eq(favoriteStore.userId, viewer.id), eq(favoriteStore.storeId, data.storeId)))
        return Result.succeed({ favorited: false })
      }

      await db.insert(favoriteStore).values({ userId: viewer.id, storeId: data.storeId })
      return Result.succeed({ favorited: true })
    },
  )

export const isFavoriteProduct = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(productIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ favorited: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.succeed({ favorited: false })

      const db = getDb()
      const existing = await db
        .select({ productId: favoriteProduct.productId })
        .from(favoriteProduct)
        .where(
          and(eq(favoriteProduct.userId, viewer.id), eq(favoriteProduct.productId, data.productId)),
        )
        .limit(1)

      return Result.succeed({ favorited: existing.length > 0 })
    },
  )

export const isFavoriteStore = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(storeIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ favorited: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.succeed({ favorited: false })

      const db = getDb()
      const existing = await db
        .select({ storeId: favoriteStore.storeId })
        .from(favoriteStore)
        .where(and(eq(favoriteStore.userId, viewer.id), eq(favoriteStore.storeId, data.storeId)))
        .limit(1)

      return Result.succeed({ favorited: existing.length > 0 })
    },
  )

export const toggleFollowStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(storeIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ following: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

      const db = getDb()
      const existing = await db
        .select({ storeId: storeFollower.storeId })
        .from(storeFollower)
        .where(and(eq(storeFollower.userId, viewer.id), eq(storeFollower.storeId, data.storeId)))
        .limit(1)

      if (existing.length > 0) {
        await db
          .delete(storeFollower)
          .where(and(eq(storeFollower.userId, viewer.id), eq(storeFollower.storeId, data.storeId)))
        return Result.succeed({ following: false })
      }

      await db.insert(storeFollower).values({ userId: viewer.id, storeId: data.storeId })
      return Result.succeed({ following: true })
    },
  )

export const isFollowingStore = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(storeIdSchema))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ following: boolean }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.succeed({ following: false })

      const db = getDb()
      const existing = await db
        .select({ storeId: storeFollower.storeId })
        .from(storeFollower)
        .where(and(eq(storeFollower.userId, viewer.id), eq(storeFollower.storeId, data.storeId)))
        .limit(1)

      return Result.succeed({ following: existing.length > 0 })
    },
  )
