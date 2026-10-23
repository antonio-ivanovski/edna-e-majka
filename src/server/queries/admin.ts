/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect } from 'effect'
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'

import { Db } from '../services/db'
import { type DatabaseError } from '../errors'
import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { buildSearchText, buildSearchVariants } from '#/lib/translit'

import { user } from '../db/auth-schema'
import {
  auditLog,
  contactMessage,
  product,
  productImage,
  productVariant,
  store,
} from '../db/schema'
import type { ProductStatus, StoreStatus } from './manage'

export type AdminPage<Row> = { items: Row[]; total: number }
export type AdminStore = {
  id: string
  name: string
  description: string
  status: StoreStatus
  statusNote: string | null
  email: string
  phone: string
  facebook: string | null
  instagram: string | null
  avatarKey: string | null
  coverKey: string | null
  city: string | null
  hours: string | null
  slug: string | null
  createdAt: Date
  reviewedAt: Date | null
  owner: { id: string; name: string; email: string }
  productCount: number
  publishedCount: number
}
export type AdminProduct = {
  id: string
  title: string
  status: ProductStatus
  createdAt: Date
  storeId: string
  storeName: string
  imageKey: string | null
  minPrice: number | null
  maxPrice: number | null
}
export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  banned: boolean
  createdAt: Date
  emailVerified: boolean
  store: { id: string; name: string; status: StoreStatus } | null
  productCount: number
}
export type AdminMessage = {
  id: string
  kind: 'contact' | 'cooperation' | 'report'
  name: string
  email: string
  phone: string | null
  website: string | null
  message: string
  createdAt: Date
  handledAt: Date | null
  /** What the report is about, if anything. */
  productId: string | null
  productTitle: string | null
  storeId: string | null
  storeName: string | null
}

function matchesQuery(values: readonly (string | null)[], query: string): boolean {
  const variants = buildSearchVariants(query)
  return values.some((value) => {
    if (!value) return false
    const text = buildSearchText(value)
    return variants.some((variant) => text.includes(variant))
  })
}

function paginate<Row>(rows: Row[], page: number): AdminPage<Row> {
  const start = (page - 1) * ADMIN_PAGE_SIZE
  return { items: rows.slice(start, start + ADMIN_PAGE_SIZE), total: rows.length }
}

const reviewFirst = sql`case when ${store.status} = 'pending' then 0 else 1 end`
const productCount = sql<number>`(select count(*) from ${product} where ${product.storeId} = ${store.id})`
const publishedCount = sql<number>`(select count(*) from ${product} where ${product.storeId} = ${store.id} and ${product.status} = 'published')`

const storeColumns = {
  id: store.id,
  name: store.name,
  description: store.description,
  status: store.status,
  statusNote: store.statusNote,
  email: store.email,
  phone: store.phone,
  facebook: store.facebook,
  instagram: store.instagram,
  avatarKey: store.avatarKey,
  coverKey: store.coverKey,
  city: store.city,
  hours: store.hours,
  slug: store.slug,
  createdAt: store.createdAt,
  reviewedAt: store.reviewedAt,
  ownerId: sql<string>`${user.id}`.as('owner_id'),
  ownerName: sql<string>`coalesce(${user.name}, '')`.as('owner_name'),
  ownerEmail: sql<string>`${user.email}`.as('owner_email'),
  productCount,
  publishedCount,
}

type StoreRow = {
  id: string
  name: string
  description: string
  status: StoreStatus
  statusNote: string | null
  email: string
  phone: string
  facebook: string | null
  instagram: string | null
  avatarKey: string | null
  coverKey: string | null
  city: string | null
  hours: string | null
  slug: string | null
  createdAt: Date
  reviewedAt: Date | null
  ownerId: string
  ownerName: string
  ownerEmail: string
  productCount: number
  publishedCount: number
}

function toAdminStore(row: StoreRow): AdminStore {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    statusNote: row.statusNote,
    email: row.email,
    phone: row.phone,
    facebook: row.facebook,
    instagram: row.instagram,
    avatarKey: row.avatarKey,
    coverKey: row.coverKey,
    city: row.city,
    hours: row.hours,
    slug: row.slug,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    owner: { id: row.ownerId, name: row.ownerName, email: row.ownerEmail },
    productCount: row.productCount,
    publishedCount: row.publishedCount,
  }
}

export const selectAdminStores = Effect.fn('selectAdminStores')(function* (filters: {
  status?: StoreStatus | undefined
  query?: string | undefined
  page: number
}): Effect.fn.Return<AdminPage<AdminStore>, DatabaseError, Db> {
  const db = yield* Db
  const where = filters.status ? eq(store.status, filters.status) : undefined

  if (!filters.query) {
    const offset = (filters.page - 1) * ADMIN_PAGE_SIZE
    const [rows, totalRows] = yield* db.run(
      (d) =>
        d.batch([
          d
            .select(storeColumns)
            .from(store)
            .innerJoin(user, eq(user.id, store.ownerId))
            .where(where)
            .orderBy(reviewFirst, desc(store.createdAt))
            .limit(ADMIN_PAGE_SIZE)
            .offset(offset),
          d
            .select({ total: count() })
            .from(store)
            .innerJoin(user, eq(user.id, store.ownerId))
            .where(where),
        ]) as unknown as Promise<[StoreRow[], { total: number }[]]>,
    )
    return { items: rows.map(toAdminStore), total: totalRows[0]?.total ?? 0 }
  }

  const rows = yield* db.run((d) =>
    d
      .select(storeColumns)
      .from(store)
      .innerJoin(user, eq(user.id, store.ownerId))
      .where(where)
      .orderBy(reviewFirst, desc(store.createdAt)),
  )
  const matched = rows.filter((row: any) =>
    matchesQuery(
      [row.name, row.email, row.ownerName, row.ownerEmail, row.description],
      filters.query!,
    ),
  )
  return paginate(matched.map(toAdminStore), filters.page)
})

export const selectAdminStore = Effect.fn('selectAdminStore')(function* (
  storeId: string,
): Effect.fn.Return<AdminStore | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select(storeColumns)
      .from(store)
      .innerJoin(user, eq(user.id, store.ownerId))
      .where(eq(store.id, storeId))
      .limit(1),
  )
  const row = rows[0]
  return row ? toAdminStore(row as StoreRow) : null
})

export const selectAdminProductRow = Effect.fn('selectAdminProductRow')(function* (
  productId: string,
): Effect.fn.Return<{ id: string; storeId: string; title: string } | null, DatabaseError, Db> {
  const db = yield* Db
  const rows = yield* db.run((d) =>
    d
      .select({ id: product.id, storeId: product.storeId, title: product.title })
      .from(product)
      .where(eq(product.id, productId))
      .limit(1),
  )
  return (rows[0] as { id: string; storeId: string; title: string } | undefined) ?? null
})

export const selectAdminProducts = Effect.fn('selectAdminProducts')(function* (filters: {
  status?: ProductStatus | undefined
  storeId?: string | undefined
  query?: string | undefined
  page: number
}): Effect.fn.Return<AdminPage<AdminProduct>, DatabaseError, Db> {
  const db = yield* Db
  const conditions: any[] = []
  if (filters.status) conditions.push(eq(product.status, filters.status))
  if (filters.storeId) conditions.push(eq(product.storeId, filters.storeId))
  if (filters.query) {
    const matches = buildSearchVariants(filters.query).map(
      (v) => sql`instr(${product.searchText}, ${v}) > 0`,
    )
    if (matches.length > 0) conditions.push(or(...matches) ?? sql`0`)
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined
  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE
  const [idRows, totalRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({ id: product.id })
          .from(product)
          .where(where)
          .orderBy(desc(product.createdAt), asc(product.id))
          .limit(ADMIN_PAGE_SIZE)
          .offset(offset),
        d.select({ total: count() }).from(product).where(where),
      ]) as unknown as Promise<[{ id: string }[], { total: number }[]]>,
  )
  const ids = idRows.map((r: any) => r.id)
  if (ids.length === 0) return { items: [], total: totalRows[0]?.total ?? 0 }
  const rows = yield* db.run((d) =>
    d
      .select({
        id: product.id,
        title: product.title,
        status: product.status,
        createdAt: product.createdAt,
        storeId: sql<string>`${store.id}`.as('store_id'),
        storeName: sql<string>`${store.name}`.as('store_name'),
        imageKey: sql<
          string | null
        >`(select ${productImage.r2Key} from ${productImage} where ${productImage.productId} = ${product.id} order by ${productImage.position} limit 1)`.as(
          'image_key',
        ),
        minPrice: sql<
          number | null
        >`(select min(${productVariant.price}) from ${productVariant} where ${productVariant.productId} = ${product.id})`.as(
          'min_price',
        ),
        maxPrice: sql<
          number | null
        >`(select max(${productVariant.price}) from ${productVariant} where ${productVariant.productId} = ${product.id})`.as(
          'max_price',
        ),
      })
      .from(product)
      .innerJoin(store, eq(store.id, product.storeId))
      .where(inArray(product.id, ids))
      .orderBy(desc(product.createdAt), asc(product.id)),
  )
  return { items: rows as AdminProduct[], total: totalRows[0]?.total ?? 0 }
})

function toAdminUser(row: any): AdminUser {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email,
    role: row.role === 'admin' ? 'admin' : 'user',
    banned: Boolean(row.banned),
    createdAt: row.createdAt,
    emailVerified: row.emailVerified,
    store: row.storeId
      ? { id: row.storeId, name: row.storeName ?? '', status: row.storeStatus ?? 'pending' }
      : null,
    productCount: row.productCount,
  }
}

export const selectAdminUsers = Effect.fn('selectAdminUsers')(function* (filters: {
  query?: string | undefined
  page: number
}): Effect.fn.Return<AdminPage<AdminUser>, DatabaseError, Db> {
  const db = yield* Db

  if (!filters.query) {
    const offset = (filters.page - 1) * ADMIN_PAGE_SIZE
    const [rows, totalRows] = yield* db.run(
      (d) =>
        d.batch([
          d
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              banned: user.banned,
              createdAt: user.createdAt,
              emailVerified: user.emailVerified,
              storeId: sql<
                string | null
              >`(select ${store.id} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
                'store_id',
              ),
              storeName: sql<
                string | null
              >`(select ${store.name} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
                'store_name',
              ),
              storeStatus:
                sql<StoreStatus | null>`(select ${store.status} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
                  'store_status',
                ),
              productCount:
                sql<number>`(select count(*) from ${product} where ${product.storeId} = (select ${store.id} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1))`.as(
                  'product_count',
                ),
            })
            .from(user)
            .orderBy(desc(user.createdAt))
            .limit(ADMIN_PAGE_SIZE)
            .offset(offset),
          d.select({ total: count() }).from(user),
        ]) as unknown as Promise<[any[], { total: number }[]]>,
    )
    return { items: rows.map(toAdminUser), total: totalRows[0]?.total ?? 0 }
  }

  const rows = yield* db.run((d) =>
    d
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        storeId: sql<
          string | null
        >`(select ${store.id} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
          'store_id',
        ),
        storeName: sql<
          string | null
        >`(select ${store.name} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
          'store_name',
        ),
        storeStatus:
          sql<StoreStatus | null>`(select ${store.status} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1)`.as(
            'store_status',
          ),
        productCount:
          sql<number>`(select count(*) from ${product} where ${product.storeId} = (select ${store.id} from ${store} where ${store.ownerId} = ${user.id} order by ${store.createdAt} limit 1))`.as(
            'product_count',
          ),
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
  )
  const matched = rows.filter((row: any) =>
    matchesQuery([row.name, row.email, row.storeName], filters.query!),
  )
  return paginate(matched.map(toAdminUser), filters.page)
})

export const selectAdminMessages = Effect.fn('selectAdminMessages')(function* (filters: {
  filter: 'open' | 'done' | 'all'
  page: number
}): Effect.fn.Return<AdminPage<AdminMessage>, DatabaseError, Db> {
  const db = yield* Db
  const where =
    filters.filter === 'open'
      ? isNull(contactMessage.handledAt)
      : filters.filter === 'done'
        ? isNotNull(contactMessage.handledAt)
        : undefined
  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE
  const [rows, totalRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({
            id: contactMessage.id,
            kind: contactMessage.kind,
            name: contactMessage.name,
            email: contactMessage.email,
            phone: contactMessage.phone,
            website: contactMessage.website,
            message: contactMessage.message,
            createdAt: contactMessage.createdAt,
            handledAt: contactMessage.handledAt,
            productId: contactMessage.productId,
            productTitle: sql<string | null>`${product.title}`.as('product_title'),
            storeId: contactMessage.storeId,
            storeName: sql<string | null>`${store.name}`.as('store_name'),
          })
          .from(contactMessage)
          .leftJoin(product, eq(product.id, contactMessage.productId))
          .leftJoin(store, eq(store.id, contactMessage.storeId))
          .where(where)
          .orderBy(desc(contactMessage.createdAt))
          .limit(ADMIN_PAGE_SIZE)
          .offset(offset),
        d.select({ total: count() }).from(contactMessage).where(where),
      ]) as unknown as Promise<[any[], { total: number }[]]>,
  )
  return { items: rows, total: totalRows[0]?.total ?? 0 }
})

export type AdminAuditEntry = {
  id: string
  actorId: string
  actorKind: 'admin' | 'owner' | 'system'
  actorName: string
  action: string
  targetType: string
  targetId: string
  details: string | null
  createdAt: Date
}

export const selectAuditLogs = Effect.fn('selectAuditLogs')(function* (filters: {
  page: number
}): Effect.fn.Return<AdminPage<AdminAuditEntry>, DatabaseError, Db> {
  const db = yield* Db
  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE
  const [rows, totalRows] = yield* db.run(
    (d) =>
      d.batch([
        d
          .select({
            id: auditLog.id,
            actorId: auditLog.actorId,
            actorKind: auditLog.actorKind,
            actorName: sql<string>`coalesce(${user.name}, '')`.as('actor_name'),
            action: auditLog.action,
            targetType: auditLog.targetType,
            targetId: auditLog.targetId,
            details: auditLog.details,
            createdAt: auditLog.createdAt,
          })
          .from(auditLog)
          .leftJoin(user, eq(user.id, auditLog.actorId))
          .orderBy(desc(auditLog.createdAt))
          .limit(ADMIN_PAGE_SIZE)
          .offset(offset),
        d.select({ total: count() }).from(auditLog),
      ]) as unknown as Promise<[AdminAuditEntry[], { total: number }[]]>,
  )
  return { items: rows, total: totalRows[0]?.total ?? 0 }
})
