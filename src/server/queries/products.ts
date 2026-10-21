import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm'

import { buildSearchVariants } from '#/lib/translit'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'
import type { ProductListFilters } from '#/lib/schemas'

import { getDb } from '../db/client'
import { product, productCategory, productImage, productVariant, store } from '../db/schema'

export type ProductImage = {
  key: string
  width: number
  height: number
  alt: string | null
}

export type ProductVariant = {
  id: string
  title: string
  price: number
}

/** What the card and the product header need from a producer. */
export type ProductStore = {
  id: string
  name: string
  avatarKey: string | null
}

export type ProductSummary = {
  id: string
  title: string
  description: string
  availability: 'in_stock' | 'out_of_stock' | 'on_order'
  createdAt: Date
  /** First image by position, or null while a listing has no photo yet. */
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

export type ProductPage = {
  items: ProductSummary[]
  total: number
}

/**
 * Columns shared by the card and the product page.
 *
 * The store columns are aliased by hand because D1 hands rows back keyed by
 * column name: two columns called `id` (or `description`) collapse into one and
 * every value after them shifts. Aliases keep the names unique.
 */
const productColumns = {
  id: product.id,
  title: product.title,
  description: product.description,
  createdAt: product.createdAt,
  availability: product.availability,
  storeId: sql<string>`${store.id}`.as('store_id'),
  storeName: sql<string>`${store.name}`.as('store_name'),
  storeAvatarKey: sql<string | null>`${store.avatarKey}`.as('store_avatar_key'),
}

/**
 * A published product in an active store is the only thing the public sees;
 * suspended, archived and pending stores disappear from every list.
 */
function publicProductConditions(filters: Partial<ProductListFilters>) {
  const conditions = [eq(product.status, 'published' as const), eq(store.status, 'active' as const)]

  if (filters.categorySlug) {
    conditions.push(
      sql`exists (
        select 1 from ${productCategory}
        where ${productCategory.productId} = ${product.id}
          and ${productCategory.categorySlug} = ${filters.categorySlug}
      )`,
    )
  }

  if (filters.storeId) {
    conditions.push(eq(product.storeId, filters.storeId))
  }

  if (filters.query) {
    // `instr` rather than `LIKE`: no wildcard to escape, and the stored text
    // already carries both scripts.
    const matches = buildSearchVariants(filters.query).map(
      (variant) => sql`instr(${product.searchText}, ${variant}) > 0`,
    )

    if (matches.length > 0) {
      conditions.push(or(...matches) ?? sql`0`)
    }
  }

  return and(...conditions)
}

/** The price shown in a listing is the cheapest variant. Null when there is none. */
const lowestVariantPrice = sql<number>`(
  select min(${productVariant.price}) from ${productVariant}
  where ${productVariant.productId} = ${product.id}
)`

function ordering(filters: ProductListFilters) {
  const direction = filters.direction

  if (filters.sort === 'alpha') {
    return [direction === 'desc' ? desc(product.title) : asc(product.title)]
  }

  if (filters.sort === 'price') {
    return [direction === 'desc' ? desc(lowestVariantPrice) : asc(lowestVariantPrice)]
  }

  return [direction === 'asc' ? asc(product.createdAt) : desc(product.createdAt)]
}

export async function selectProductPage(filters: ProductListFilters): Promise<ProductPage> {
  const db = getDb()
  const where = publicProductConditions(filters)
  const offset = (filters.page - 1) * PRODUCT_PAGE_SIZE

  const [idRows, totalRows] = await db.batch([
    db
      .select({ id: product.id })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(where)
      // The id keeps paging stable when two products share a timestamp or price.
      .orderBy(...ordering(filters), asc(product.id))
      .limit(PRODUCT_PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(where),
  ])

  const items = await selectProductSummaries(idRows.map((row) => row.id))

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  }
}

/**
 * Loads everything a card shows for the given products, in four batched queries,
 * and returns them in the order they were asked for.
 */
export async function selectProductSummaries(
  productIds: readonly string[],
): Promise<ProductSummary[]> {
  if (productIds.length === 0) {
    return []
  }

  const db = getDb()

  const [productRows, imageRows, variantRows, categoryRows] = await db.batch([
    db
      .select(productColumns)
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(inArray(product.id, [...productIds])),
    db
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
    db
      .select({
        id: productVariant.id,
        productId: productVariant.productId,
        title: productVariant.title,
        price: productVariant.price,
      })
      .from(productVariant)
      .where(inArray(productVariant.productId, [...productIds]))
      .orderBy(asc(productVariant.position)),
    db
      .select({
        productId: productCategory.productId,
        categorySlug: productCategory.categorySlug,
      })
      .from(productCategory)
      .where(inArray(productCategory.productId, [...productIds])),
  ])

  const byId = new Map(productRows.map((row) => [row.id, row]))

  return productIds.flatMap((productId) => {
    const row = byId.get(productId)

    if (!row) {
      return []
    }

    const images = imageRows.filter((image) => image.productId === productId)

    return [
      {
        id: row.id,
        title: row.title,
        description: row.description,
        availability: row.availability,
        createdAt: row.createdAt,
        image: images[0] ?? null,
        variants: variantRows
          .filter((variant) => variant.productId === productId)
          .map(({ id, title, price }) => ({ id, title, price }))
          .sort((left, right) => left.price - right.price),
        categorySlugs: categoryRows
          .filter((category) => category.productId === productId)
          .map((category) => category.categorySlug),
        store: {
          id: row.storeId,
          name: row.storeName,
          avatarKey: row.storeAvatarKey,
        },
      },
    ]
  })
}

export async function selectProductDetail(productId: string): Promise<ProductDetail | null> {
  const db = getDb()

  const [rows, imageRows, variantRows, categoryRows] = await db.batch([
    db
      .select({
        ...productColumns,
        // Aliased for the same reason as the store columns above: `description`
        // already exists in `productColumns`.
        storeDescription: sql<string>`${store.description}`.as('store_description'),
        storeEmail: sql<string>`${store.email}`.as('store_email'),
        storePhone: sql<string>`${store.phone}`.as('store_phone'),
        storeFacebook: sql<string | null>`${store.facebook}`.as('store_facebook'),
        storeInstagram: sql<string | null>`${store.instagram}`.as('store_instagram'),
      })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(
        and(eq(product.id, productId), eq(product.status, 'published'), eq(store.status, 'active')),
      )
      .limit(1),
    db
      .select({
        key: productImage.r2Key,
        width: productImage.width,
        height: productImage.height,
        alt: productImage.alt,
      })
      .from(productImage)
      .where(eq(productImage.productId, productId))
      .orderBy(asc(productImage.position)),
    db
      .select({
        id: productVariant.id,
        title: productVariant.title,
        price: productVariant.price,
      })
      .from(productVariant)
      .where(eq(productVariant.productId, productId))
      .orderBy(asc(productVariant.position)),
    db
      .select({ categorySlug: productCategory.categorySlug })
      .from(productCategory)
      .where(eq(productCategory.productId, productId)),
  ])

  const row = rows[0]

  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    availability: row.availability,
    createdAt: row.createdAt,
    image: imageRows[0] ?? null,
    images: imageRows,
    variants: variantRows.sort((left, right) => left.price - right.price),
    categorySlugs: categoryRows.map((category) => category.categorySlug),
    store: {
      id: row.storeId,
      name: row.storeName,
      avatarKey: row.storeAvatarKey,
      description: row.storeDescription,
      email: row.storeEmail,
      phone: row.storePhone,
      facebook: row.storeFacebook,
      instagram: row.storeInstagram,
    },
  }
}
