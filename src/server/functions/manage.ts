/**
 * The owner dashboard: applying for a shop, editing it, and everything a
 * producer does with their products.
 *
 * Reads are called from route loaders and establish who the caller is from the
 * session cookie alone. Writes answer with an `ActionResult`, so a form can
 * show the reason instead of tripping the route error boundary — and every one
 * of them re-checks that the shop belongs to the caller, because a route guard
 * protects the page, not the endpoint.
 */
import { notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { BatchItem } from 'drizzle-orm/batch'
import { eq } from 'drizzle-orm'

import { NOT_ALLOWED, NOT_SIGNED_IN, type ActionResult } from '#/lib/action'
import {
  manageProductSchema,
  productDeleteSchema,
  productFormSchema,
  productImageAltSchema,
  productStatusSchema,
  storeDetailsSchema,
  storeIdSchema,
  storeUpdateSchema,
} from '#/lib/schemas'
import { buildSearchText } from '#/lib/translit'
import { optionalText } from '#/lib/text'

import { getDb } from '../db/client'
import { product, productCategory, productImage, productVariant, store } from '../db/schema'
import { withViewer } from '../middleware'
import { reviewShopApplication } from '../moderation'
import { selectAdminProductRow } from '../queries/admin'
import {
  selectOwnedProductRow,
  selectOwnerProduct,
  selectOwnerProducts,
  selectOwnerStore,
  selectOwnerStoreById,
} from '../queries/manage'
import { deleteProductCascade } from '../product-writes'

/** No session, no page: the router turns this into the sign-in redirect. */
async function requireOwner(ownerId: string | undefined): Promise<string> {
  if (!ownerId) {
    throw redirect({ to: '/sign-in' })
  }

  return ownerId
}

/**
 * One statement per row: D1 allows a hundred bound parameters per statement and
 * a product's variants are unbounded, so batching rows would eventually fail.
 */
function rowStatements<Statement extends BatchItem<'sqlite'>>(
  statements: Statement[],
): [Statement, ...Statement[]] | null {
  const [first, ...rest] = statements

  return first ? [first, ...rest] : null
}

export const getManageHome = createServerFn({ method: 'GET' })
  .middleware([withViewer])
  .handler(async ({ context }) => {
    const ownerId = await requireOwner(context.viewer?.id)
    const ownStore = await selectOwnerStore(ownerId)

    return {
      store: ownStore,
      products: ownStore ? await selectOwnerProducts(ownStore.id) : [],
    }
  })

export const getManageStore = createServerFn({ method: 'GET' })
  .middleware([withViewer])
  .validator(storeIdSchema)
  .handler(async ({ context, data }) => {
    const ownerId = await requireOwner(context.viewer?.id)
    const ownStore = await selectOwnerStoreById(data.storeId, ownerId)

    if (!ownStore) {
      throw notFound()
    }

    return { store: ownStore }
  })

export const getManageProducts = createServerFn({ method: 'GET' })
  .middleware([withViewer])
  .validator(storeIdSchema)
  .handler(async ({ context, data }) => {
    const ownerId = await requireOwner(context.viewer?.id)
    const ownStore = await selectOwnerStoreById(data.storeId, ownerId)

    if (!ownStore) {
      throw notFound()
    }

    return { store: ownStore, products: await selectOwnerProducts(ownStore.id) }
  })

export const getManageProduct = createServerFn({ method: 'GET' })
  .middleware([withViewer])
  .validator(manageProductSchema)
  .handler(async ({ context, data }) => {
    const ownerId = await requireOwner(context.viewer?.id)
    const ownStore = await selectOwnerStoreById(data.storeId, ownerId)

    if (!ownStore) {
      throw notFound()
    }

    const owned = await selectOwnerProduct(data.productId, ownStore.id)

    if (!owned) {
      throw notFound()
    }

    return { store: ownStore, product: owned }
  })

/** A shop is applied for, never created by a form that claims to own it. */
export const applyForStore = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(storeDetailsSchema)
  .handler(async ({ context, data }): Promise<ActionResult<{ storeId: string }>> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    if (await selectOwnerStore(viewer.id)) {
      return { ok: false, message: 'Веќе имате регистрирано продавница.' }
    }

    const verdict = reviewShopApplication({ name: data.name, description: data.description })
    const storeId = crypto.randomUUID()

    await getDb()
      .insert(store)
      .values({
        id: storeId,
        ownerId: viewer.id,
        name: data.name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        facebook: optionalText(data.facebook),
        instagram: optionalText(data.instagram),
        status: verdict.status,
        statusNote: verdict.status === 'pending' ? verdict.note : null,
      })

    return { ok: true, data: { storeId } }
  })

export const updateStore = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(storeUpdateSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    if (!(await selectOwnerStoreById(data.storeId, viewer.id))) {
      return NOT_ALLOWED
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
      })
      .where(eq(store.id, data.storeId))

    return { ok: true, data: null }
  })

export const saveProduct = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(productFormSchema)
  .handler(async ({ context, data }): Promise<ActionResult<{ productId: string }>> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    if (!(await selectOwnerStoreById(data.storeId, viewer.id))) {
      return NOT_ALLOWED
    }

    const db = getDb()
    const searchText = buildSearchText(data.title, data.description)
    const productId = data.productId ?? crypto.randomUUID()

    if (data.productId) {
      if (!(await selectOwnerProduct(data.productId, data.storeId))) {
        return NOT_ALLOWED
      }

      await db
        .update(product)
        .set({ title: data.title, description: data.description, searchText })
        .where(eq(product.id, productId))
    } else {
      await db.insert(product).values({
        id: productId,
        storeId: data.storeId,
        title: data.title,
        description: data.description,
        searchText,
      })
    }

    // The packagings are replaced wholesale: the form is the whole truth.
    await db.delete(productVariant).where(eq(productVariant.productId, productId))
    await db.delete(productCategory).where(eq(productCategory.productId, productId))

    const statements = rowStatements([
      ...data.variants.map((variant, position) =>
        db.insert(productVariant).values({
          id: crypto.randomUUID(),
          productId,
          title: variant.title,
          price: variant.price,
          position,
        }),
      ),
      ...data.categories.map((categorySlug) =>
        db.insert(productCategory).values({ productId, categorySlug }),
      ),
    ])

    if (statements) {
      await db.batch(statements)
    }

    return { ok: true, data: { productId } }
  })

export const setProductArchived = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(productStatusSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    if (!(await selectOwnedProductRow(data.productId, viewer.id))) {
      return NOT_ALLOWED
    }

    await getDb()
      .update(product)
      .set({
        status: data.archived ? 'archived' : 'published',
        archivedAt: data.archived ? new Date() : null,
        archivedBy: data.archived ? viewer.id : null,
      })
      .where(eq(product.id, data.productId))

    return { ok: true, data: null }
  })

export const deleteProduct = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(productDeleteSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    if (!(await selectOwnedProductRow(data.productId, viewer.id))) {
      return NOT_ALLOWED
    }

    await deleteProductCascade(data.productId)

    return { ok: true, data: null }
  })

export const updateProductImageAlt = createServerFn({ method: 'POST' })
  .middleware([withViewer])
  .validator(productImageAltSchema)
  .handler(async ({ context, data }): Promise<ActionResult> => {
    const viewer = context.viewer

    if (!viewer) {
      return NOT_SIGNED_IN
    }

    const rows = await getDb()
      .select({ productId: productImage.productId })
      .from(productImage)
      .where(eq(productImage.id, data.imageId))
      .limit(1)

    const image = rows[0]

    if (!image) {
      return { ok: false, message: 'Сликата не е најдена.' }
    }

    const owned =
      viewer.role === 'admin'
        ? await selectAdminProductRow(image.productId)
        : await selectOwnedProductRow(image.productId, viewer.id)

    if (!owned) {
      return NOT_ALLOWED
    }

    await getDb()
      .update(productImage)
      .set({ alt: data.alt.trim() ? data.alt.trim() : null })
      .where(eq(productImage.id, data.imageId))

    return { ok: true, data: null }
  })
