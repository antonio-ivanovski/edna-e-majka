import { notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { BatchItem } from 'drizzle-orm/batch'
import { eq } from 'drizzle-orm'

import { Effect, Result, Schema } from 'effect'
import type { DomainError } from '../errors'
import { InvalidInputError, NotAllowedError, NotFoundError, NotSignedInError } from '../errors'
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
import { createNotification } from '../functions/notifications'
import { user } from '../db/auth-schema'
import { Env } from '../services/env'
import {
  product,
  productCategory,
  productImage,
  productVariant,
  store,
  storeFollower,
} from '../db/schema'
import { withViewer } from '../middleware'
import { reviewShopApplication } from '../moderation'
import { sendNewApplicationNotification, sendNewProductNotification } from '../notifications'
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
      const ownStore = await runEffect(selectOwnerStoreById(data.storeId, viewer.id))
      if (!ownStore)
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
            attributes: data.attributes ?? null,
          })
          .where(eq(product.id, productId))
      } else {
        const slug = await runEffect(claimProductSlug(data.title))
        await db.insert(product).values({
          id: productId,
          storeId: data.storeId,
          title: data.title,
          description: data.description,
          searchText,
          availability: data.availability,
          attributes: data.attributes ?? null,
          slug,
        })

        // Notify followers. Best-effort.
        const followers = await db
          .select({ id: user.id, email: user.email })
          .from(storeFollower)
          .innerJoin(user, eq(user.id, storeFollower.userId))
          .where(eq(storeFollower.storeId, data.storeId))

        const appUrl =
          (await runEffect(
            Effect.gen(function* () {
              const e = yield* Env
              return e.APP_URL
            }),
          )) ?? ''
        const productUrl = appUrl + '/products/' + slug

        for (const follower of followers) {
          await createNotification({
            userId: follower.id,
            kind: 'new_product',
            title: 'Нов производ',
            body: data.title,
            link: '/products/' + slug,
          })
          await runEffect(
            sendNewProductNotification({
              to: follower.email,
              storeName: ownStore.name,
              productTitle: data.title,
              productUrl,
            }),
          ).catch(() => undefined)
        }
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

export const exportStoreProductsCSV = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(StoreId))
  .handler(async ({ context, data }): Promise<Result.Result<string, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

    const ownStore = await runEffect(selectOwnerStoreById(data.storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))

    const page = await runEffect(selectOwnerProducts(ownStore.id, 1))
    let all = page.items
    let current = 1
    const pageSize = 20
    while (page.items.length === pageSize) {
      current += 1
      const next = await runEffect(selectOwnerProducts(ownStore.id, current))
      if (next.items.length === 0) break
      all = all.concat(next.items)
      if (next.items.length < pageSize) break
    }

    const lines = ['title,description,categories,availability,variants']
    for (const summary of all) {
      const detail = await runEffect(selectOwnerProduct(summary.id, ownStore.id))
      if (!detail) continue
      const categories = detail.categories.join(';')
      const variants = detail.variants.map((v) => v.title + ':' + v.price).join(';')
      const escape = (value: string) => '"' + value.replace(/"/g, '""') + '"'
      lines.push(
        [
          escape(detail.title),
          escape(detail.description),
          escape(categories),
          detail.availability,
          escape(variants),
        ].join(','),
      )
    }

    return Result.succeed(lines.join('\n'))
  })

export const importStoreProductsCSV = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(Schema.Struct({ storeId: Schema.String, csv: Schema.String })))
  .handler(async ({ context, data }): Promise<Result.Result<{ count: number }, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

    const ownStore = await runEffect(selectOwnerStoreById(data.storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа акција.' }))

    const lines = data.csv.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) {
      return Result.fail(new InvalidInputError({ message: 'CSV-то е празно.' }))
    }

    let count = 0

    for (let i = 1; i < lines.length; i += 1) {
      const row = parseCsvLine(lines[i]!)
      if (!row) continue

      const title = row[0]
      const description = row[1] ?? ''
      const categoriesRaw = row[2] ?? ''
      const availability = row[3] ?? ''
      const variantsRaw = row[4] ?? ''

      const categories = categoriesRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      const variants = variantsRaw
        .split(';')
        .map((entry) => {
          const parts = entry.split(':')
          const variantTitle = parts[0]?.trim() || 'Стандардно'
          const price = Number(parts[1]) || 0
          return { title: variantTitle, price }
        })
        .filter((variant) => variant.price > 0)

      if (variants.length === 0) {
        variants.push({ title: 'Стандардно', price: 0 })
      }

      const productId = crypto.randomUUID()
      await getDb()
        .insert(product)
        .values({
          id: productId,
          storeId: ownStore.id,
          title: title!,
          description: description || title!,
          searchText: buildSearchText(title!, description || title!),
          availability: (availability as 'in_stock' | 'out_of_stock' | 'on_order') || 'in_stock',
          slug: await runEffect(claimProductSlug(title!)),
        })

      for (const [position, variant] of variants.entries()) {
        await getDb().insert(productVariant).values({
          id: crypto.randomUUID(),
          productId,
          title: variant.title,
          price: variant.price,
          position,
        })
      }

      for (const categorySlug of categories) {
        await getDb().insert(productCategory).values({ productId, categorySlug })
      }

      count += 1
    }

    return Result.succeed({ count })
  })

function parseCsvLine(line: string): string[] | null {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i += 2
        continue
      }
      if (char === '"') {
        inQuotes = false
        i += 1
        continue
      }
      current += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (char === ',') {
      result.push(current)
      current = ''
      i += 1
      continue
    }

    current += char
    i += 1
  }

  result.push(current)

  return result.length >= 5 ? result : null
}
