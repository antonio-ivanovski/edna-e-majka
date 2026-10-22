/**
 * The admin dashboard: moderation of shops and listings, account roles, and the
 * contact inbox.
 *
 * Reads are called from route loaders. Writes answer with an `ActionResult` so
 * the dashboard can show the reason in place; `withAdmin` has already refused
 * anyone whose session is not an admin's, so the handlers do not repeat it.
 */
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { Effect, Result } from 'effect'
import type { DomainError } from '../errors'
import { InvalidInputError, NotAllowedError, NotFoundError } from '../errors'
import {
  toValidator,
  AdminMessage,
  AdminMessageHandled,
  AdminMessageList,
  AdminProductList,
  AdminStoreDetails,
  AdminBulkStoreStatus,
  AdminStoreList,
  AdminStoreStatus,
  AdminTransferStore,
  AdminUserList,
  AdminUserBan,
  AdminUserRole,
  ProductDelete,
  ProductForm,
  ProductStatusSchema as ProductStatus,
  StoreId,
  ToggleFeatured,
} from '#/api/schemas'
import { buildSearchText } from '#/lib/translit'

import { user } from '../db/auth-schema'
import { getDb } from '../db/client'
import { Env } from '../services/env'
import { contactMessage, product, productCategory, productVariant, store } from '../db/schema'
import { withAdmin } from '../middleware'
import { runEffect } from '../runtime'
import { recordAudit } from '../audit'
import { sendModerationDecision } from '../notifications'
import { deleteProductCascade, deleteStoreCascade } from '../product-writes'
import {
  setStoreStatus as setStoreStatusEffect,
  updateStoreDetails as updateStoreDetailsEffect,
} from '../writes'
import {
  selectAdminMessages,
  selectAdminProductRow,
  selectAdminProducts,
  selectAdminStore,
  selectAdminStores,
  selectAdminUsers,
} from '../queries/admin'
import { selectOwnerProduct, selectOwnerStore } from '../queries/manage'

export const getAdminStores = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminStoreList))
  .handler(async ({ data }) => runEffect(selectAdminStores(data)))

export const getAdminStore = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(StoreId))
  .handler(async ({ data }) => {
    const found = await runEffect(selectAdminStore(data.storeId))

    if (!found) {
      throw notFound()
    }

    return {
      store: found,
      products: await runEffect(selectAdminProducts({ storeId: data.storeId, page: 1 })),
    }
  })

export const getAdminProducts = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminProductList))
  .handler(async ({ data }) => runEffect(selectAdminProducts(data)))

export const getAdminUsers = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminUserList))
  .handler(async ({ data }) => runEffect(selectAdminUsers(data)))

export const getAdminMessages = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminMessageList))
  .handler(async ({ data }) => runEffect(selectAdminMessages(data)))

/**
 * The moderation decision. The note is rewritten when it is sent and kept when
 * it is not, so a quick approval from the list does not erase the reason an
 * earlier suspension gave.
 */
export const setStoreStatus = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminStoreStatus))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    try {
      await runEffect(
        setStoreStatusEffect(data.storeId, data.status, data.note, {
          kind: 'admin',
          id: context.admin.id,
        }),
      )

      await runEffect(
        recordAudit({
          actorId: context.admin.id,
          actorKind: 'admin',
          action: 'set_store_status',
          targetType: 'store',
          targetId: data.storeId,
          details: data.status,
        }),
      )

      // Tell the owner what changed. Best-effort.
      const rows = await getDb()
        .select({ name: store.name, ownerId: store.ownerId })
        .from(store)
        .where(eq(store.id, data.storeId))
        .limit(1)

      const row = rows[0]

      if (row) {
        const ownerRows = await getDb()
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, row.ownerId))
          .limit(1)

        const ownerEmail = ownerRows[0]?.email
        const appUrl =
          (await runEffect(
            Effect.gen(function* () {
              const e = yield* Env
              return e.APP_URL
            }),
          )) ?? ''

        if (ownerEmail) {
          await runEffect(
            sendModerationDecision({
              to: ownerEmail,
              storeName: row.name,
              status: data.status,
              note: data.note ?? null,
              appUrl,
            }),
          ).catch(() => undefined)
        }
      }

      return Result.succeed(null)
    } catch (e) {
      return Result.fail(new NotFoundError({ message: (e as Error).message || 'Грешка.' }))
    }
  })

/** An admin may correct the details of any shop; ownership stays where it is. */
export const adminUpdateStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminStoreDetails))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    try {
      await runEffect(updateStoreDetailsEffect(data.storeId, data, { kind: 'admin', id: 'admin' }))
      return Result.succeed(null)
    } catch (e) {
      return Result.fail(new NotFoundError({ message: (e as Error).message || 'Грешка.' }))
    }
  })

/**
 * Removes a shop with everything that belonged to it: the listings, the photos,
 * the logo and the cover.
 */
export const adminDeleteStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(StoreId))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const rows = await getDb()
      .select({ id: store.id })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Продавницата не е најдена.' }))
    }

    await runEffect(
      recordAudit({
        actorId: context.admin.id,
        actorKind: 'admin',
        action: 'delete_store',
        targetType: 'store',
        targetId: data.storeId,
      }),
    )
    await runEffect(deleteStoreCascade(data.storeId))

    return Result.succeed(null)
  })

/**
 * Moves a shop to another account, for the cases the platform cannot solve by
 * itself. One shop per person still holds: the target must not have one.
 */
export const adminToggleFeatured = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(ToggleFeatured))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const rows = await getDb()
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, data.productId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Производот не е најден.' }))
    }

    await getDb()
      .update(product)
      .set({ featured: data.featured })
      .where(eq(product.id, data.productId))

    return Result.succeed(null)
  })

export const adminBulkSetStoreStatus = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminBulkStoreStatus))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    for (const storeId of data.storeIds) {
      try {
        await runEffect(
          setStoreStatusEffect(storeId, data.status, null, { kind: 'admin', id: context.admin.id }),
        )
      } catch {
        // Skip missing stores.
      }
    }

    return Result.succeed(null)
  })

export const adminSetUserBanned = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminUserBan))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    await getDb().update(user).set({ banned: data.banned }).where(eq(user.id, data.userId))

    await runEffect(
      recordAudit({
        actorId: context.admin.id,
        actorKind: 'admin',
        action: data.banned ? 'ban_user' : 'unban_user',
        targetType: 'user',
        targetId: data.userId,
      }),
    )

    return Result.succeed(null)
  })

export const transferStoreOwner = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminTransferStore))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const db = getDb()
    const email = data.email.trim().toLowerCase()

    const candidates = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`)
      .limit(1)

    const target = candidates[0]

    if (!target) {
      return Result.fail(new NotFoundError({ message: 'Нема корисник со таа е-маил адреса.' }))
    }

    const rows = await db
      .select({ id: store.id, ownerId: store.ownerId })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    const current = rows[0]

    if (!current) {
      return Result.fail(new NotFoundError({ message: 'Продавницата не е најдена.' }))
    }

    if (current.ownerId === target.id) {
      return Result.fail(new NotAllowedError({ message: 'Продавницата веќе е на таа адреса.' }))
    }

    if (await runEffect(selectOwnerStore(target.id))) {
      return Result.fail(new NotAllowedError({ message: 'Тој корисник веќе има продавница.' }))
    }

    await db.update(store).set({ ownerId: target.id }).where(eq(store.id, data.storeId))

    return Result.succeed(null)
  })

export const adminSetProductArchived = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(ProductStatus))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const db = getDb()

    const rows = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, data.productId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Производот не е најден.' }))
    }

    await db
      .update(product)
      .set({
        status: data.archived ? 'archived' : 'published',
        archivedAt: data.archived ? new Date() : null,
        archivedBy: data.archived ? context.admin.id : null,
      })
      .where(eq(product.id, data.productId))

    return Result.succeed(null)
  })

export const adminDeleteProduct = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(ProductDelete))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const rows = await getDb()
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, data.productId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Производот не е најден.' }))
    }

    await runEffect(deleteProductCascade(data.productId))

    return Result.succeed(null)
  })

/**
 * Roles are the only account setting an admin has. Changing your own is
 * refused: the platform must not be able to lose its last administrator by a
 * mis-click.
 */
export const setUserRole = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminUserRole))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    if (data.userId === context.admin.id) {
      return Result.fail(
        new NotAllowedError({ message: 'Не можете да ја смените сопствената улога.' }),
      )
    }

    const rows = await getDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Корисникот не е најден.' }))
    }

    await getDb().update(user).set({ role: data.role }).where(eq(user.id, data.userId))

    return Result.succeed(null)
  })

export const setMessageHandled = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminMessageHandled))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const rows = await getDb()
      .select({ id: contactMessage.id })
      .from(contactMessage)
      .where(eq(contactMessage.id, data.messageId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Пораката не е најдена.' }))
    }

    await getDb()
      .update(contactMessage)
      .set({ handledAt: data.handled ? new Date() : null })
      .where(eq(contactMessage.id, data.messageId))

    return Result.succeed(null)
  })

export const deleteMessage = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(AdminMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const rows = await getDb()
      .select({ id: contactMessage.id })
      .from(contactMessage)
      .where(eq(contactMessage.id, data.messageId))
      .limit(1)

    if (!rows[0]) {
      return Result.fail(new NotFoundError({ message: 'Пораката не е најдена.' }))
    }

    await getDb().delete(contactMessage).where(eq(contactMessage.id, data.messageId))

    return Result.succeed(null)
  })

export const getAdminProduct = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(ProductDelete))
  .handler(async ({ data }) => {
    const row = await runEffect(selectAdminProductRow(data.productId))

    if (!row) {
      throw notFound()
    }

    const product = await runEffect(selectOwnerProduct(data.productId, row.storeId))

    if (!product) {
      throw notFound()
    }

    const store = await runEffect(selectAdminStore(row.storeId))

    if (!store) {
      throw notFound()
    }

    return { store, product }
  })

export const adminSaveProduct = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withAdmin])
  .validator(toValidator(ProductForm))
  .handler(async ({ data }): Promise<Result.Result<{ productId: string }, DomainError>> => {
    if (!data.productId) {
      return Result.fail(new InvalidInputError({ message: 'Недостасува производ.' }))
    }

    const row = await runEffect(selectAdminProductRow(data.productId))

    if (!row) {
      return Result.fail(new NotFoundError({ message: 'Производот не е најден.' }))
    }

    const db = getDb()
    const searchText = buildSearchText(data.title, data.description)
    const productId = data.productId

    await db
      .update(product)
      .set({
        title: data.title,
        description: data.description,
        searchText,
        availability: data.availability,
        attributes: data.attributes ?? null,
      })
      .where(eq(product.id, productId))

    await db.delete(productVariant).where(eq(productVariant.productId, productId))
    await db.delete(productCategory).where(eq(productCategory.productId, productId))

    for (const [position, variant] of data.variants.entries()) {
      await db.insert(productVariant).values({
        id: crypto.randomUUID(),
        productId,
        title: variant.title,
        price: variant.price,
        position,
      })
    }

    for (const categorySlug of data.categories) {
      await db.insert(productCategory).values({ productId, categorySlug })
    }

    return Result.succeed({ productId })
  })
