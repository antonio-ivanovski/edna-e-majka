/**
 * Reads for the owner dashboard: everything the signed-in producer may see
 * about their own shop, including the states the public never gets (pending,
 * suspended, archived, unpublished products).
 *
 * Ownership is always part of the `where` clause — a store is fetched *for* an
 * owner, never by id alone.
 */
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { getDb } from '../db/client'
import { product, productCategory, productImage, productVariant, store } from '../db/schema'

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'archived'
export type ProductStatus = 'published' | 'archived'

export type OwnerStore = {
  id: string
  name: string
  description: string
  email: string
  phone: string
  facebook: string | null
  instagram: string | null
  avatarKey: string | null
  status: StoreStatus
  statusNote: string | null
  createdAt: Date
}

export type OwnerProduct = {
  id: string
  title: string
  status: ProductStatus
  createdAt: Date
  imageKey: string | null
  /** Cheapest and dearest packaging; both null while no variant exists. */
  minPrice: number | null
  maxPrice: number | null
  variantCount: number
}

export type OwnerProductImage = {
  id: string
  key: string
  alt: string | null
  width: number
  height: number
}

/** Just enough to know a product exists and whose shop it lives in. */
export type OwnedProductRow = {
  id: string
  storeId: string
  title: string
  storeName: string
  status: ProductStatus
}

export type OwnerProductDetail = {
  id: string
  storeId: string
  title: string
  description: string
  status: ProductStatus
  categories: string[]
  variants: { id: string; title: string; price: number }[]
  images: OwnerProductImage[]
}

const storeColumns = {
  id: store.id,
  name: store.name,
  description: store.description,
  email: store.email,
  phone: store.phone,
  facebook: store.facebook,
  instagram: store.instagram,
  avatarKey: store.avatarKey,
  status: store.status,
  statusNote: store.statusNote,
  createdAt: store.createdAt,
}

/** The owner's shop. There is one per person, so the oldest wins. */
export async function selectOwnerStore(ownerId: string): Promise<OwnerStore | null> {
  const db = getDb()

  const rows = await db
    .select(storeColumns)
    .from(store)
    .where(eq(store.ownerId, ownerId))
    .orderBy(asc(store.createdAt))
    .limit(1)

  return rows[0] ?? null
}

export async function selectOwnerStoreById(
  storeId: string,
  ownerId: string,
): Promise<OwnerStore | null> {
  const db = getDb()

  const rows = await db
    .select(storeColumns)
    .from(store)
    .where(and(eq(store.id, storeId), eq(store.ownerId, ownerId)))
    .limit(1)

  return rows[0] ?? null
}

export async function selectOwnerProducts(storeId: string): Promise<OwnerProduct[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: product.id,
      title: product.title,
      status: product.status,
      createdAt: product.createdAt,
    })
    .from(product)
    .where(eq(product.storeId, storeId))
    .orderBy(desc(product.createdAt))

  if (rows.length === 0) {
    return []
  }

  const productIds = rows.map((row) => row.id)

  const [variantRows, imageRows] = await db.batch([
    db
      .select({
        productId: productVariant.productId,
        price: productVariant.price,
      })
      .from(productVariant)
      .where(inArray(productVariant.productId, productIds)),
    db
      .select({
        productId: productImage.productId,
        r2Key: productImage.r2Key,
        position: productImage.position,
      })
      .from(productImage)
      .where(inArray(productImage.productId, productIds))
      .orderBy(asc(productImage.position)),
  ])

  return rows.map((row) => {
    const prices = variantRows.filter((variant) => variant.productId === row.id).map((v) => v.price)
    const firstImage = imageRows.find((image) => image.productId === row.id)

    return {
      ...row,
      imageKey: firstImage?.r2Key ?? null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      variantCount: prices.length,
    }
  })
}

export async function selectOwnerProduct(
  productId: string,
  storeId: string,
): Promise<OwnerProductDetail | null> {
  const db = getDb()

  const [rows, imageRows, variantRows, categoryRows] = await db.batch([
    db
      .select({
        id: product.id,
        storeId: product.storeId,
        title: product.title,
        description: product.description,
        status: product.status,
      })
      .from(product)
      .where(and(eq(product.id, productId), eq(product.storeId, storeId)))
      .limit(1),
    db
      .select({
        id: productImage.id,
        r2Key: productImage.r2Key,
        alt: productImage.alt,
        width: productImage.width,
        height: productImage.height,
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
    ...row,
    categories: categoryRows.map((category) => category.categorySlug),
    variants: variantRows,
    images: imageRows.map((image) => ({
      id: image.id,
      key: image.r2Key,
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
  }
}

/**
 * A product is only ever looked up as belonging to someone: the join through
 * the shop is what makes it theirs.
 */
export async function selectOwnedProductRow(
  productId: string,
  ownerId: string,
): Promise<OwnedProductRow | null> {
  const db = getDb()

  const rows = await db
    .select({
      id: product.id,
      storeId: product.storeId,
      title: product.title,
      status: product.status,
      storeName: store.name,
    })
    .from(product)
    .innerJoin(store, eq(store.id, product.storeId))
    .where(and(eq(product.id, productId), eq(store.ownerId, ownerId)))
    .limit(1)

  return rows[0] ?? null
}

/** The images of a product, for the delete that also clears the bucket. */
export async function selectProductImageKeys(productId: string): Promise<string[]> {
  const db = getDb()

  const rows = await db
    .select({ r2Key: productImage.r2Key })
    .from(productImage)
    .where(eq(productImage.productId, productId))

  return rows.map((row) => row.r2Key)
}

export async function selectNextImagePosition(productId: string): Promise<number> {
  const db = getDb()

  const rows = await db
    .select({ position: productImage.position })
    .from(productImage)
    .where(eq(productImage.productId, productId))

  return rows.reduce((next, row) => Math.max(next, row.position + 1), 0)
}
