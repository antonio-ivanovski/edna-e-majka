/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect } from 'effect'
import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm'

import { Db } from '../services/db'
import { type DatabaseError } from '../errors'
import { buildSearchVariants } from '#/lib/translit'
import { MAX_CATALOGUE_ITEMS, PRODUCT_PAGE_SIZE } from '#/lib/pagination'
import type { ProductListFilters as ProductListFiltersType } from '#/api/schemas'
import { product, productCategory, productImage, productVariant, store } from '../db/schema'

export type ProductImage = { key: string; width: number; height: number; alt: string | null }
export type ProductVariant = { id: string; title: string; price: number }
export type ProductStore = {
  id: string
  name: string
  avatarKey: string | null
  slug: string | null
}
export type ProductSummary = {
  id: string
  title: string
  description: string
  availability: 'in_stock' | 'out_of_stock' | 'on_order'
  slug: string | null
  createdAt: Date
  image: ProductImage | null
  variants: ProductVariant[]
  categorySlugs: string[]
  store: ProductStore
}
export type ProductDetail = ProductSummary & {
  images: ProductImage[]
  store: ProductStore & {
    description: string
    email: string
    phone: string
    facebook: string | null
    instagram: string | null
  }
}
export type ProductPage = { items: ProductSummary[]; total: number }

const productColumns = {
  id: product.id,
  title: product.title,
  description: product.description,
  createdAt: product.createdAt,
  availability: product.availability,
  slug: product.slug,
  storeId: sql<string>`${store.id}`.as('store_id'),
  storeName: sql<string>`${store.name}`.as('store_name'),
  storeAvatarKey: sql<string | null>`${store.avatarKey}`.as('store_avatar_key'),
  storeSlug: sql<string | null>`${store.slug}`.as('store_slug'),
}

function publicProductConditions(filters: Partial<ProductListFiltersType>) {
  const conditions = [eq(product.status, 'published' as const), eq(store.status, 'active' as const)]
  if (filters.categorySlug) {
    conditions.push(
      sql`exists (select 1 from ${productCategory} where ${productCategory.productId} = ${product.id} and ${productCategory.categorySlug} = ${filters.categorySlug})`,
    )
  }
  if (filters.storeId) conditions.push(eq(product.storeId, filters.storeId))
  if (filters.query) {
    const matches = buildSearchVariants(filters.query).map(
      (v) => sql`instr(${product.searchText}, ${v}) > 0`,
    )
    if (matches.length > 0) conditions.push(or(...matches) ?? sql`0`)
  }
  return and(...conditions)
}

const lowestVariantPrice = sql<number>`(select min(${productVariant.price}) from ${productVariant} where ${productVariant.productId} = ${product.id})`

function ordering(filters: ProductListFiltersType) {
  const direction = filters.direction
  if (filters.sort === 'alpha')
    return [direction === 'desc' ? desc(product.title) : asc(product.title)]
  if (filters.sort === 'price')
    return [direction === 'desc' ? desc(lowestVariantPrice) : asc(lowestVariantPrice)]
  return [direction === 'asc' ? asc(product.createdAt) : desc(product.createdAt)]
}

export const selectProductPage = Effect.fn('selectProductPage')(function* (
  filters: ProductListFiltersType,
): Effect.fn.Return<ProductPage, DatabaseError, Db> {
  const db = yield* Db
  const where = publicProductConditions(filters)
  const limit = Math.min(filters.page * PRODUCT_PAGE_SIZE, MAX_CATALOGUE_ITEMS)
  const [idRows, totalRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({ id: product.id })
          .from(product)
          .innerJoin(store, eq(store.id, product.storeId))
          .where(where)
          .orderBy(...ordering(filters), asc(product.id))
          .limit(limit),
        d
          .select({ total: count() })
          .from(product)
          .innerJoin(store, eq(store.id, product.storeId))
          .where(where),
      ]) as unknown as Promise<[{ id: string }[], { total: number }[]]>,
  )
  const items = yield* selectProductSummaries(idRows.map((r) => r.id))
  return { items, total: totalRows[0]?.total ?? 0 }
})

export const selectProductSummaries = Effect.fn('selectProductSummaries')(function* (
  productIds: readonly string[],
): Effect.fn.Return<ProductSummary[], DatabaseError, Db> {
  if (productIds.length === 0) return []
  const db = yield* Db
  const [productRows, imageRows, variantRows, categoryRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select(productColumns)
          .from(product)
          .innerJoin(store, eq(store.id, product.storeId))
          .where(inArray(product.id, [...productIds])),
        d
          .select({
            productId: productImage.productId,
            key: productImage.r2Key,
            width: productImage.width,
            height: productImage.height,
            alt: productImage.alt,
          })
          .from(productImage)
          .where(inArray(productImage.productId, [...productIds]))
          .orderBy(asc(productImage.position)),
        d
          .select({
            id: productVariant.id,
            productId: productVariant.productId,
            title: productVariant.title,
            price: productVariant.price,
          })
          .from(productVariant)
          .where(inArray(productVariant.productId, [...productIds]))
          .orderBy(asc(productVariant.position)),
        d
          .select({
            productId: productCategory.productId,
            categorySlug: productCategory.categorySlug,
          })
          .from(productCategory)
          .where(inArray(productCategory.productId, [...productIds])),
      ]) as unknown as Promise<[any[], any[], any[], any[]]>,
  )
  const byId = new Map(productRows.map((row: any) => [row.id, row]))
  return productIds.flatMap((productId) => {
    const row = byId.get(productId)
    if (!row) return []
    const images = imageRows.filter((image: any) => image.productId === productId)
    return [
      {
        id: row.id,
        title: row.title,
        description: row.description,
        availability: row.availability,
        slug: row.slug,
        createdAt: row.createdAt,
        image: images[0] ?? null,
        variants: variantRows
          .filter((v: any) => v.productId === productId)
          .map(({ id, title, price }: any) => ({ id, title, price }))
          .sort((a: any, b: any) => a.price - b.price),
        categorySlugs: categoryRows
          .filter((c: any) => c.productId === productId)
          .map((c: any) => c.categorySlug),
        store: {
          id: row.storeId,
          name: row.storeName,
          avatarKey: row.storeAvatarKey,
          slug: row.storeSlug,
        },
      },
    ]
  })
})

export const selectProductsByStore = Effect.fn('selectProductsByStore')(function* (
  storeId: string,
  excludeProductId: string,
  limit = 4,
): Effect.fn.Return<ProductSummary[], DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select({ id: product.id })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(
        and(
          eq(product.storeId, storeId),
          eq(product.status, 'published'),
          eq(store.status, 'active'),
          sql`${product.id} <> ${excludeProductId}`,
        ),
      )
      .orderBy(desc(product.createdAt))
      .limit(limit),
  )
  return yield* selectProductSummaries(rows.map((r: any) => r.id))
})

export const selectProductsByCategories = Effect.fn('selectProductsByCategories')(function* (
  categorySlugs: readonly string[],
  excludeProductId: string,
  limit = 4,
): Effect.fn.Return<ProductSummary[], DatabaseError, Db> {
  if (categorySlugs.length === 0) return []
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .selectDistinct({ id: product.id })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .innerJoin(productCategory, eq(productCategory.productId, product.id))
      .where(
        and(
          inArray(productCategory.categorySlug, [...categorySlugs]),
          eq(product.status, 'published'),
          eq(store.status, 'active'),
          sql`${product.id} <> ${excludeProductId}`,
        ),
      )
      .orderBy(desc(product.createdAt))
      .limit(limit),
  )
  return yield* selectProductSummaries(rows.map((r: any) => r.id))
})

export const selectProductDetail = Effect.fn('selectProductDetail')(function* (
  productId: string,
): Effect.fn.Return<ProductDetail | null, DatabaseError, Db> {
  const db = yield* Db
  const [rows, imageRows, variantRows, categoryRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({
            ...productColumns,
            storeDescription: sql<string>`${store.description}`.as('store_description'),
            storeEmail: sql<string>`${store.email}`.as('store_email'),
            storePhone: sql<string>`${store.phone}`.as('store_phone'),
            storeFacebook: sql<string | null>`${store.facebook}`.as('store_facebook'),
            storeInstagram: sql<string | null>`${store.instagram}`.as('store_instagram'),
          })
          .from(product)
          .innerJoin(store, eq(store.id, product.storeId))
          .where(
            and(
              or(eq(product.id, productId), eq(product.slug, productId)),
              eq(product.status, 'published'),
              eq(store.status, 'active'),
            ),
          )
          .limit(1),
        d
          .select({
            key: productImage.r2Key,
            width: productImage.width,
            height: productImage.height,
            alt: productImage.alt,
          })
          .from(productImage)
          .where(eq(productImage.productId, productId))
          .orderBy(asc(productImage.position)),
        d
          .select({
            id: productVariant.id,
            title: productVariant.title,
            price: productVariant.price,
          })
          .from(productVariant)
          .where(eq(productVariant.productId, productId))
          .orderBy(asc(productVariant.position)),
        d
          .select({ categorySlug: productCategory.categorySlug })
          .from(productCategory)
          .where(eq(productCategory.productId, productId)),
      ]) as unknown as Promise<[any[], any[], any[], any[]]>,
  )
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    availability: row.availability,
    slug: row.slug,
    createdAt: row.createdAt,
    image: imageRows[0] ?? null,
    images: imageRows,
    variants: variantRows.sort((a: any, b: any) => a.price - b.price),
    categorySlugs: categoryRows.map((c: any) => c.categorySlug),
    store: {
      id: row.storeId,
      name: row.storeName,
      avatarKey: row.storeAvatarKey,
      slug: row.storeSlug,
      description: row.storeDescription,
      email: row.storeEmail,
      phone: row.storePhone,
      facebook: row.storeFacebook,
      instagram: row.storeInstagram,
    },
  }
})
