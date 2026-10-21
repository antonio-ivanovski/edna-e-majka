/**
 * Reads for the admin dashboard: every shop, every listing, every account and
 * the contact inbox, including the states the public never gets.
 *
 * The three small lists filter their text in JavaScript after fetching the rows
 * for the chosen status. Shops, accounts and messages number in the hundreds,
 * their tables have no search column because the public site never searches
 * them, and matching in JavaScript keeps Cyrillic and Latin interchangeable the
 * same way the catalogue does. Products already carry `search_text`, so their
 * filter stays in SQL and pages there.
 */
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'

import { ADMIN_PAGE_SIZE } from '#/lib/pagination'
import { buildSearchText, buildSearchVariants } from '#/lib/translit'

import { user } from '../db/auth-schema'
import { getDb } from '../db/client'
import { contactMessage, product, productImage, productVariant, store } from '../db/schema'
import type { ProductStatus, StoreStatus } from './manage'

export type AdminPage<Row> = {
  items: Row[]
  total: number
}

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
  city: string | null
  hours: string | null
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
  createdAt: Date
  emailVerified: boolean
  store: { id: string; name: string; status: StoreStatus } | null
  productCount: number
}

export type AdminMessage = {
  id: string
  kind: 'contact' | 'cooperation'
  name: string
  email: string
  phone: string | null
  website: string | null
  message: string
  createdAt: Date
  handledAt: Date | null
}

/** A term matches if any of the fields carries it in either script. */
function matchesQuery(values: readonly (string | null)[], query: string): boolean {
  const variants = buildSearchVariants(query)

  return values.some((value) => {
    if (!value) {
      return false
    }

    const text = buildSearchText(value)

    return variants.some((variant) => text.includes(variant))
  })
}

function paginate<Row>(rows: Row[], page: number): AdminPage<Row> {
  const start = (page - 1) * ADMIN_PAGE_SIZE

  return { items: rows.slice(start, start + ADMIN_PAGE_SIZE), total: rows.length }
}

/** New work first: an application waiting for review outranks a settled shop. */
const reviewFirst = sql`case when ${store.status} = 'pending' then 0 else 1 end`

const productCount = sql<number>`(
  select count(*) from ${product} where ${product.storeId} = ${store.id}
)`

const publishedCount = sql<number>`(
  select count(*) from ${product}
  where ${product.storeId} = ${store.id} and ${product.status} = 'published'
)`

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
  city: store.city,
  hours: store.hours,
  createdAt: store.createdAt,
  reviewedAt: store.reviewedAt,
  // The account behind the shop has columns with the same names as the shop's.
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
  city: string | null
  hours: string | null
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
    city: row.city,
    hours: row.hours,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    owner: { id: row.ownerId, name: row.ownerName, email: row.ownerEmail },
    productCount: row.productCount,
    publishedCount: row.publishedCount,
  }
}

export async function selectAdminStores(filters: {
  status?: StoreStatus | undefined
  query?: string | undefined
  page: number
}): Promise<AdminPage<AdminStore>> {
  const db = getDb()

  const rows = await db
    .select(storeColumns)
    .from(store)
    .innerJoin(user, eq(user.id, store.ownerId))
    .where(filters.status ? eq(store.status, filters.status) : undefined)
    .orderBy(reviewFirst, desc(store.createdAt))

  const query = filters.query
  const matched = query
    ? rows.filter((row) =>
        matchesQuery([row.name, row.email, row.ownerName, row.ownerEmail, row.description], query),
      )
    : rows

  return paginate(matched.map(toAdminStore), filters.page)
}

export async function selectAdminStore(storeId: string): Promise<AdminStore | null> {
  const db = getDb()

  const rows = await db
    .select(storeColumns)
    .from(store)
    .innerJoin(user, eq(user.id, store.ownerId))
    .where(eq(store.id, storeId))
    .limit(1)

  const row = rows[0]

  return row ? toAdminStore(row) : null
}

/** The bits an upload needs to know about any product, admin or not. */
export async function selectAdminProductRow(
  productId: string,
): Promise<{ id: string; storeId: string; title: string } | null> {
  const db = getDb()

  const rows = await db
    .select({ id: product.id, storeId: product.storeId, title: product.title })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1)

  return rows[0] ?? null
}

export async function selectAdminProducts(filters: {
  status?: ProductStatus | undefined
  storeId?: string | undefined
  query?: string | undefined
  page: number
}): Promise<AdminPage<AdminProduct>> {
  const db = getDb()
  const conditions = []

  if (filters.status) {
    conditions.push(eq(product.status, filters.status))
  }

  if (filters.storeId) {
    conditions.push(eq(product.storeId, filters.storeId))
  }

  if (filters.query) {
    const matches = buildSearchVariants(filters.query).map(
      (variant) => sql`instr(${product.searchText}, ${variant}) > 0`,
    )

    if (matches.length > 0) {
      conditions.push(or(...matches) ?? sql`0`)
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE

  const [idRows, totalRows] = await db.batch([
    db
      .select({ id: product.id })
      .from(product)
      .where(where)
      .orderBy(desc(product.createdAt), asc(product.id))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(product).where(where),
  ])

  const ids = idRows.map((row) => row.id)

  if (ids.length === 0) {
    return { items: [], total: totalRows[0]?.total ?? 0 }
  }

  const rows = await db
    .select({
      id: product.id,
      title: product.title,
      status: product.status,
      createdAt: product.createdAt,
      storeId: sql<string>`${store.id}`.as('store_id'),
      storeName: sql<string>`${store.name}`.as('store_name'),
      imageKey: sql<string | null>`(
        select ${productImage.r2Key} from ${productImage}
        where ${productImage.productId} = ${product.id}
        order by ${productImage.position} limit 1
      )`.as('image_key'),
      minPrice: sql<number | null>`(
        select min(${productVariant.price}) from ${productVariant}
        where ${productVariant.productId} = ${product.id}
      )`.as('min_price'),
      maxPrice: sql<number | null>`(
        select max(${productVariant.price}) from ${productVariant}
        where ${productVariant.productId} = ${product.id}
      )`.as('max_price'),
    })
    .from(product)
    .innerJoin(store, eq(store.id, product.storeId))
    .where(inArray(product.id, ids))
    .orderBy(desc(product.createdAt), asc(product.id))

  return { items: rows, total: totalRows[0]?.total ?? 0 }
}

export async function selectAdminUsers(filters: {
  query?: string | undefined
  page: number
}): Promise<AdminPage<AdminUser>> {
  const db = getDb()

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      storeId: sql<string | null>`(
        select ${store.id} from ${store} where ${store.ownerId} = ${user.id}
        order by ${store.createdAt} limit 1
      )`.as('store_id'),
      storeName: sql<string | null>`(
        select ${store.name} from ${store} where ${store.ownerId} = ${user.id}
        order by ${store.createdAt} limit 1
      )`.as('store_name'),
      storeStatus: sql<StoreStatus | null>`(
        select ${store.status} from ${store} where ${store.ownerId} = ${user.id}
        order by ${store.createdAt} limit 1
      )`.as('store_status'),
      productCount: sql<number>`(
        select count(*) from ${product}
        where ${product.storeId} = (
          select ${store.id} from ${store} where ${store.ownerId} = ${user.id}
          order by ${store.createdAt} limit 1
        )
      )`.as('product_count'),
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  const query = filters.query
  const matched = query
    ? rows.filter((row) => matchesQuery([row.name, row.email, row.storeName], query))
    : rows

  return paginate(
    matched.map((row) => ({
      id: row.id,
      name: row.name ?? '',
      email: row.email,
      role: row.role === 'admin' ? 'admin' : 'user',
      createdAt: row.createdAt,
      emailVerified: row.emailVerified,
      store: row.storeId
        ? { id: row.storeId, name: row.storeName ?? '', status: row.storeStatus ?? 'pending' }
        : null,
      productCount: row.productCount,
    })),
    filters.page,
  )
}

export async function selectAdminMessages(filters: {
  filter: 'open' | 'done' | 'all'
  page: number
}): Promise<AdminPage<AdminMessage>> {
  const db = getDb()

  const where =
    filters.filter === 'open'
      ? isNull(contactMessage.handledAt)
      : filters.filter === 'done'
        ? isNotNull(contactMessage.handledAt)
        : undefined

  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE

  const [rows, totalRows] = await db.batch([
    db
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
      })
      .from(contactMessage)
      .where(where)
      .orderBy(desc(contactMessage.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(contactMessage).where(where),
  ])

  return { items: rows, total: totalRows[0]?.total ?? 0 }
}
