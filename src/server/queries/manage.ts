/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect } from 'effect'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'

import { Db } from '../services/db'
import { type DatabaseError } from '../errors'
import { MANAGE_PAGE_SIZE } from '#/lib/pagination'
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
  coverKey: string | null
  city: string | null
  hours: string | null
  slug: string | null
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
  availability: 'in_stock' | 'out_of_stock' | 'on_order'
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
  coverKey: store.coverKey,
  city: store.city,
  hours: store.hours,
  slug: store.slug,
  status: store.status,
  statusNote: store.statusNote,
  createdAt: store.createdAt,
}

export const selectOwnerStore = Effect.fn('selectOwnerStore')(function* (
  ownerId: string,
): Effect.fn.Return<OwnerStore | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select(storeColumns)
      .from(store)
      .where(eq(store.ownerId, ownerId))
      .orderBy(store.createdAt)
      .limit(1),
  )
  return (rows[0] as OwnerStore | undefined) ?? null
})

export const selectOwnerStoreById = Effect.fn('selectOwnerStoreById')(function* (
  storeId: string,
  ownerId: string,
): Effect.fn.Return<OwnerStore | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select(storeColumns)
      .from(store)
      .where(and(eq(store.id, storeId), eq(store.ownerId, ownerId)))
      .limit(1),
  )
  return (rows[0] as OwnerStore | undefined) ?? null
})

export const selectOwnerProducts = Effect.fn('selectOwnerProducts')(function* (
  storeId: string,
  page = 1,
): Effect.fn.Return<{ items: OwnerProduct[]; total: number }, DatabaseError, Db> {
  const db = yield* Db
  const offset = (page - 1) * MANAGE_PAGE_SIZE
  const [rows, countRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({
            id: product.id,
            title: product.title,
            status: product.status,
            createdAt: product.createdAt,
            imageKey: productImage.r2Key,
          })
          .from(product)
          .leftJoin(
            productImage,
            and(eq(productImage.productId, product.id), eq(productImage.position, 0)),
          )
          .where(eq(product.storeId, storeId))
          .orderBy(desc(product.createdAt))
          .limit(MANAGE_PAGE_SIZE)
          .offset(offset),
        d.select({ total: count() }).from(product).where(eq(product.storeId, storeId)),
      ]) as unknown as Promise<[any[], { total: number }[]]>,
  )
  // aggregate variants per product
  const ids = rows.map((r: any) => r.id)
  const variants = ids.length
    ? yield* db.run((d) =>
        d
          .select({ productId: productVariant.productId, price: productVariant.price })
          .from(productVariant)
          .where(inArray(productVariant.productId, ids)),
      )
    : []
  const byProduct = new Map<string, number[]>()
  for (const v of variants) {
    if (!byProduct.has(v.productId)) byProduct.set(v.productId, [])
    byProduct.get(v.productId)!.push(v.price)
  }
  const items: OwnerProduct[] = rows.map((r: any) => {
    const prices = byProduct.get(r.id) ?? []
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
      imageKey: r.imageKey ?? null,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      variantCount: prices.length,
    }
  })
  return { items, total: countRows[0]?.total ?? 0 }
})

export const selectOwnerProduct = Effect.fn('selectOwnerProduct')(function* (
  productId: string,
  storeId: string,
): Effect.fn.Return<OwnerProductDetail | null, DatabaseError, Db> {
  const db = yield* Db
  const [prodRows, imageRows, variantRows, categoryRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({
            id: product.id,
            storeId: product.storeId,
            title: product.title,
            description: product.description,
            status: product.status,
            availability: product.availability,
          })
          .from(product)
          .where(and(eq(product.id, productId), eq(product.storeId, storeId)))
          .limit(1),
        d
          .select({
            id: productImage.id,
            key: productImage.r2Key,
            alt: productImage.alt,
            width: productImage.width,
            height: productImage.height,
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
  const prod = prodRows[0]
  if (!prod) return null
  return {
    id: prod.id,
    storeId: prod.storeId,
    title: prod.title,
    description: prod.description,
    status: prod.status,
    availability: prod.availability,
    categories: categoryRows.map((c: any) => c.categorySlug),
    variants: variantRows.map(({ id, title, price }: any) => ({ id, title, price })),
    images: imageRows.map(({ id, key, alt, width, height }: any) => ({
      id,
      key,
      alt,
      width,
      height,
    })),
  }
})

export const selectOwnedProductRow = Effect.fn('selectOwnedProductRow')(function* (
  productId: string,
  ownerId: string,
): Effect.fn.Return<OwnedProductRow | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select({
        id: product.id,
        storeId: product.storeId,
        title: product.title,
        storeName: store.name,
        status: product.status,
      })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(and(eq(product.id, productId), eq(store.ownerId, ownerId)))
      .limit(1),
  )
  return (rows[0] as OwnedProductRow | undefined) ?? null
})

export const selectNextImagePosition = Effect.fn('selectNextImagePosition')(function* (
  productId: string,
): Effect.fn.Return<number, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select({ position: productImage.position })
      .from(productImage)
      .where(eq(productImage.productId, productId))
      .orderBy(desc(productImage.position))
      .limit(1),
  )
  return rows.length ? (rows[0]?.position ?? 0) + 1 : 0
})
