import { notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { BatchItem } from 'drizzle-orm/batch'
import { eq } from 'drizzle-orm'

import { Effect, Result } from 'effect'
import type { DomainError } from '../errors'
import { NotAllowedError, NotFoundError, NotSignedInError } from '../errors'
import {
  toValidator,
  ManageProduct,
  ManageProducts,
  ProductDelete,
  ProductForm,
  ProductImageAlt,
  ProductStatusSchema as ProductStatus,
  StoreDetails,
  StoreId,
  StoreUpdate,
} from '#/api/schemas'
import { buildSearchText } from '#/lib/translit'
import { optionalText } from '#/lib/text'

import { getDb } from '../db/client'
import { Env } from '../services/env'
import { product, productCategory, productImage, productVariant, store } from '../db/schema'
import { withViewer } from '../middleware'
import { reviewShopApplication } from '../moderation'
import { sendNewApplicationNotification } from '../notifications'
import { selectAdminProductRow } from '../queries/admin'
import {
  selectOwnedProductRow,
  selectOwnerProduct,
  selectOwnerProducts,
  selectOwnerStore,
  selectOwnerStoreById,
} from '../queries/manage'
import { deleteProductCascade, deleteStoreCascade } from '../product-writes'
import { updateStoreDetails as updateStoreDetailsEffect } from '../writes'
import { claimProductSlug, claimStoreSlug } from '../slug'
import { runEffect } from '../runtime'

function requireOwner(ownerId: string | undefined): string {
  if (!ownerId) throw redirect({ to: '/sign-in' })
  return ownerId
}

function rowStatements<Statement extends BatchItem<'sqlite'>>(
  statements: Statement[],
): [Statement, ...Statement[]] | null {
  const [first, ...rest] = statements
  return first ? [first, ...rest] : null
}

export const getManageHome = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .handler(async ({ context }) => {
    const ownerId = requireOwner(context.viewer?.id)
    const ownStore = await runEffect(selectOwnerStore(ownerId))
    return {
      store: ownStore,
      products: ownStore ? (await runEffect(selectOwnerProducts(ownStore.id))).items : [],
    }
  })

export const getManageStore = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(StoreId))
  .handler(async ({ context, data }) => {
    const ownerId = requireOwner(context.viewer?.id)
    const ownStore = await runEffect(selectOwnerStoreById(data.storeId, ownerId))
    if (!ownStore) throw notFound()
    return { store: ownStore }
  })

export const getManageProducts = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ManageProducts))
  .handler(async ({ context, data }) => {
    const ownerId = requireOwner(context.viewer?.id)
    const ownStore = await runEffect(selectOwnerStoreById(data.storeId, ownerId))
    if (!ownStore) throw notFound()
    const page = await runEffect(selectOwnerProducts(ownStore.id, data.page))
    return { store: ownStore, products: page.items, total: page.total }
  })

export const getManageProduct = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ManageProduct))
  .handler(async ({ context, data }) => {
    const ownerId = requireOwner(context.viewer?.id)
    const ownStore = await runEffect(selectOwnerStoreById(data.storeId, ownerId))
    if (!ownStore) throw notFound()
    const owned = await runEffect(selectOwnerProduct(data.productId, ownStore.id))
    if (!owned) throw notFound()
    return { store: ownStore, product: owned }
  })

export const applyForStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(StoreDetails))
  .handler(async ({ context, data }): Promise<Result.Result<{ storeId: string }, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const existing = await runEffect(selectOwnerStore(viewer.id))
    if (existing)
      return Result.fail(new NotAllowedError({ message: 'Веќе имате регистрирано продавница.' }))
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
        city: optionalText(data.city),
        hours: optionalText(data.hours),
        slug: await runEffect(claimStoreSlug(data.name)),
        status: verdict.status,
        statusNote: verdict.status === 'pending' ? verdict.note : null,
      })

    // Tell the admin. Best-effort: a delivery problem must not undo the
    // application that was just saved.
    const adminEmail =
      (await runEffect(
        Effect.gen(function* () {
          const e = yield* Env
          return e.ADMIN_EMAIL
        }),
      )) ?? undefined
    const appUrl =
      (await runEffect(
        Effect.gen(function* () {
          const e = yield* Env
          return e.APP_URL
        }),
      )) ?? ''

    if (adminEmail) {
      await runEffect(
        sendNewApplicationNotification({
          to: adminEmail,
          storeName: data.name,
          ownerName: viewer.name || viewer.email,
          ownerEmail: viewer.email,
          needsReview: verdict.status === 'pending',
          appUrl,
        }),
      ).catch(() => undefined)
    }

    return Result.succeed({ storeId })
  })

export const updateStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(StoreUpdate))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    try {
      await runEffect(
        updateStoreDetailsEffect(data.storeId, data, { kind: 'owner', id: viewer.id }),
      )
      return Result.succeed(null)
    } catch (e) {
      return Result.fail(
        new NotAllowedError({ message: (e as Error).message || 'Немате дозвола за оваа акција.' }),
      )
    }
  })

export const saveProduct = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ProductForm))
  .handler(
    async ({ context, data }): Promise<Result.Result<{ productId: string }, DomainError>> => {
      const viewer = context.viewer
      if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
      if (!(await runEffect(selectOwnerStoreById(data.storeId, viewer.id))))
        return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
      const db = getDb()
      const searchText = buildSearchText(data.title, data.description)
      const productId = data.productId ?? crypto.randomUUID()
      if (data.productId) {
        if (!(await runEffect(selectOwnerProduct(data.productId, data.storeId))))
          return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
        await db
          .update(product)
          .set({
            title: data.title,
            description: data.description,
            searchText,
            availability: data.availability,
          })
          .where(eq(product.id, productId))
      } else {
        await db.insert(product).values({
          id: productId,
          storeId: data.storeId,
          title: data.title,
          description: data.description,
          searchText,
          availability: data.availability,
          slug: await runEffect(claimProductSlug(data.title)),
        })
      }
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
      if (statements) await db.batch(statements)
      return Result.succeed({ productId })
    },
  )

export const setProductArchived = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ProductStatus))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    if (!(await runEffect(selectOwnedProductRow(data.productId, viewer.id))))
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
    await getDb()
      .update(product)
      .set({
        status: data.archived ? 'archived' : 'published',
        archivedAt: data.archived ? new Date() : null,
        archivedBy: data.archived ? viewer.id : null,
      })
      .where(eq(product.id, data.productId))
    return Result.succeed(null)
  })

export const deleteProduct = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ProductDelete))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    if (!(await runEffect(selectOwnedProductRow(data.productId, viewer.id))))
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
    await runEffect(deleteProductCascade(data.productId))
    return Result.succeed(null)
  })

export const deleteStore = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(StoreId))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    if (!(await runEffect(selectOwnerStoreById(data.storeId, viewer.id))))
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
    await runEffect(deleteStoreCascade(data.storeId))
    return Result.succeed(null)
  })

export const updateProductImageAlt = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(ProductImageAlt))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const db = getDb()
    const rows = await db
      .select({ productId: productImage.productId })
      .from(productImage)
      .where(eq(productImage.id, data.imageId))
      .limit(1)
    const image = rows[0]
    if (!image) return Result.fail(new NotFoundError({ message: 'Сликата не е најдена.' }))
    const owned =
      viewer.role === 'admin'
        ? await selectAdminProductRow(image.productId)
        : await runEffect(selectOwnedProductRow(image.productId, viewer.id))
    if (!owned)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))
    await db
      .update(productImage)
      .set({ alt: data.alt.trim() ? data.alt.trim() : null })
      .where(eq(productImage.id, data.imageId))
    return Result.succeed(null)
  })
