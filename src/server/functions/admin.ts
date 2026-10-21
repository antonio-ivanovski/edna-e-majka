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
import { z } from 'zod'

import type { ActionResult } from '#/lib/action'
import {
  adminMessageHandledSchema,
  adminMessageSchema,
  adminStoreDetailsSchema,
  adminStoreStatusSchema,
  adminTransferStoreSchema,
  adminUserRoleSchema,
  productDeleteSchema,
  productFormSchema,
  productStatusSchema,
  storeIdSchema,
} from '#/lib/schemas'
import { buildSearchText } from '#/lib/translit'
import { optionalText } from '#/lib/text'

import { user } from '../db/auth-schema'
import { getDb } from '../db/client'
import { contactMessage, product, productCategory, productVariant, store } from '../db/schema'
import { withAdmin } from '../middleware'
import { runEffect } from '../runtime'
import { deleteProductCascade, deleteStoreCascade } from '../product-writes'
import {
  selectAdminMessages,
  selectAdminProductRow,
  selectAdminProducts,
  selectAdminStore,
  selectAdminStores,
  selectAdminUsers,
} from '../queries/admin'
import { selectOwnerProduct, selectOwnerStore } from '../queries/manage'

const storeStatusSchema = z.enum(['pending', 'active', 'suspended', 'archived'])
const productStatusEnum = z.enum(['published', 'archived'])

const adminStoreListSchema = z.object({
  status: storeStatusSchema.optional(),
  query: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
})

const adminProductListSchema = z.object({
  status: productStatusEnum.optional(),
  query: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
})

const adminUserListSchema = z.object({
  query: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
})

const adminMessageListSchema = z.object({
  filter: z.enum(['open', 'done', 'all']).default('open'),
  page: z.coerce.number().int().min(1).max(500).default(1),
})

export const getAdminStores = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(adminStoreListSchema)
  .handler(async ({ data }) => selectAdminStores(data))

export const getAdminStore = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(storeIdSchema)
  .handler(async ({ data }) => {
    const found = await selectAdminStore(data.storeId)

    if (!found) {
      throw notFound()
    }

    return {
      store: found,
      products: await selectAdminProducts({ storeId: data.storeId, page: 1 }),
    }
  })

export const getAdminProducts = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(adminProductListSchema)
  .handler(async ({ data }) => selectAdminProducts(data))

export const getAdminUsers = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(adminUserListSchema)
  .handler(async ({ data }) => selectAdminUsers(data))

export const getAdminMessages = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(adminMessageListSchema)
  .handler(async ({ data }) => selectAdminMessages(data))

/**
 * The moderation decision. The note is rewritten when it is sent and kept when
 * it is not, so a quick approval from the list does not erase the reason an
 * earlier suspension gave.
 */
export const setStoreStatus = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminStoreStatusSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const db = getDb()

    const rows = await db
      .select({ id: store.id })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Продавницата не е најдена.' }
    }

    await db
      .update(store)
      .set({
        status: data.status,
        ...(data.note === undefined ? {} : { statusNote: data.note || null }),
        reviewedBy: context.admin.id,
        reviewedAt: new Date(),
      })
      .where(eq(store.id, data.storeId))

    return { ok: true, data: null }
  })

/** An admin may correct the details of any shop; ownership stays where it is. */
export const adminUpdateStore = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminStoreDetailsSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const rows = await getDb()
      .select({ id: store.id })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Продавницата не е најдена.' }
    }

    await getDb()
      .update(store)
      .set({
        name: data.name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        facebook: optionalText(data.facebook),
        instagram: optionalText(data.instagram),
        city: optionalText(data.city),
        hours: optionalText(data.hours),
      })
      .where(eq(store.id, data.storeId))

    return { ok: true, data: null }
  })

/**
 * Removes a shop with everything that belonged to it: the listings, the photos,
 * the logo and the cover.
 */
export const adminDeleteStore = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(storeIdSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const rows = await getDb()
      .select({ id: store.id })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Продавницата не е најдена.' }
    }

    await deleteStoreCascade(data.storeId)

    return { ok: true, data: null }
  })

/**
 * Moves a shop to another account, for the cases the platform cannot solve by
 * itself. One shop per person still holds: the target must not have one.
 */ export const transferStoreOwner = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminTransferStoreSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const db = getDb()
    const email = data.email.trim().toLowerCase()

    const candidates = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(sql`lower(${user.email}) = ${email}`)
      .limit(1)

    const target = candidates[0]

    if (!target) {
      return { ok: false, message: 'Нема корисник со таа е-маил адреса.' }
    }

    const rows = await db
      .select({ id: store.id, ownerId: store.ownerId })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    const current = rows[0]

    if (!current) {
      return { ok: false, message: 'Продавницата не е најдена.' }
    }

    if (current.ownerId === target.id) {
      return { ok: false, message: 'Продавницата веќе е на таа адреса.' }
    }

    if (await selectOwnerStore(target.id)) {
      return { ok: false, message: 'Тој корисник веќе има продавница.' }
    }

    await db.update(store).set({ ownerId: target.id }).where(eq(store.id, data.storeId))

    return { ok: true, data: null }
  })

export const adminSetProductArchived = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(productStatusSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const db = getDb()

    const rows = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, data.productId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Производот не е најден.' }
    }

    await db
      .update(product)
      .set({
        status: data.archived ? 'archived' : 'published',
        archivedAt: data.archived ? new Date() : null,
        archivedBy: data.archived ? context.admin.id : null,
      })
      .where(eq(product.id, data.productId))

    return { ok: true, data: null }
  })

export const adminDeleteProduct = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(productDeleteSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const rows = await getDb()
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, data.productId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Производот не е најден.' }
    }

    await deleteProductCascade(data.productId)

    return { ok: true, data: null }
  })

/**
 * Roles are the only account setting an admin has. Changing your own is
 * refused: the platform must not be able to lose its last administrator by a
 * mis-click.
 */
export const setUserRole = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminUserRoleSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    if (data.userId === context.admin.id) {
      return { ok: false, message: 'Не можете да ја смените сопствената улога.' }
    }

    const rows = await getDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Корисникот не е најден.' }
    }

    await getDb().update(user).set({ role: data.role }).where(eq(user.id, data.userId))

    return { ok: true, data: null }
  })

export const setMessageHandled = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminMessageHandledSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const rows = await getDb()
      .select({ id: contactMessage.id })
      .from(contactMessage)
      .where(eq(contactMessage.id, data.messageId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Пораката не е најдена.' }
    }

    await getDb()
      .update(contactMessage)
      .set({ handledAt: data.handled ? new Date() : null })
      .where(eq(contactMessage.id, data.messageId))

    return { ok: true, data: null }
  })

export const deleteMessage = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(adminMessageSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const rows = await getDb()
      .select({ id: contactMessage.id })
      .from(contactMessage)
      .where(eq(contactMessage.id, data.messageId))
      .limit(1)

    if (!rows[0]) {
      return { ok: false, message: 'Пораката не е најдена.' }
    }

    await getDb().delete(contactMessage).where(eq(contactMessage.id, data.messageId))

    return { ok: true, data: null }
  })

export const getAdminProduct = createServerFn({ method: 'GET' })
  .middleware([withAdmin])
  .validator(productDeleteSchema)
  .handler(async ({ data }) => {
    const row = await selectAdminProductRow(data.productId)

    if (!row) {
      throw notFound()
    }

    const product = await runEffect(selectOwnerProduct(data.productId, row.storeId))

    if (!product) {
      throw notFound()
    }

    const store = await selectAdminStore(row.storeId)

    if (!store) {
      throw notFound()
    }

    return { store, product }
  })

export const adminSaveProduct = createServerFn({ method: 'POST' })
  .middleware([withAdmin])
  .validator(productFormSchema)
  .handler(async ({ data }): Promise<ActionResult<{ productId: string }>> => {
    if (!data.productId) {
      return { ok: false, message: 'Недостасува производ.' }
    }

    const row = await selectAdminProductRow(data.productId)

    if (!row) {
      return { ok: false, message: 'Производот не е најден.' }
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

    return { ok: true, data: { productId } }
  })
