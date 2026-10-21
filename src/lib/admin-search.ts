import { z } from 'zod'

/**
 * Filters for the four admin tables. They live in the URL like the public
 * listing's do, so a moderator can bookmark "pending shops" or send the link to
 * another admin.
 *
 * Empty values are dropped rather than written as `?q=&page=1`, which keeps a
 * fresh dashboard on clean URLs.
 */
const pageSchema = z.coerce.number().int().min(1).max(500)

const storeStatusSchema = z.enum(['pending', 'active', 'suspended', 'archived'])
const productStatusSchema = z.enum(['published', 'archived'])
const messageFilterSchema = z.enum(['open', 'done', 'all'])

export type AdminListSearch = {
  q?: string | undefined
  page?: number | undefined
}

export type AdminStoreSearch = AdminListSearch & {
  status?: z.infer<typeof storeStatusSchema> | undefined
}

export type AdminProductSearch = AdminListSearch & {
  status?: z.infer<typeof productStatusSchema> | undefined
}

export type AdminMessageSearch = {
  filter?: z.infer<typeof messageFilterSchema> | undefined
  page?: number | undefined
}

export type MessageFilter = NonNullable<AdminMessageSearch['filter']>

/** A trimmed term, or nothing: a bare `?q=` should not filter at all. */
function term(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim().slice(0, 64) : ''

  return trimmed || undefined
}

function page(value: unknown): number | undefined {
  return pageSchema.optional().catch(undefined).parse(value)
}

export function parseAdminListSearch(search: Record<string, unknown>): AdminListSearch {
  return { q: term(search.q), page: page(search.page) }
}

export function parseAdminStoreSearch(search: Record<string, unknown>): AdminStoreSearch {
  return {
    ...parseAdminListSearch(search),
    status: storeStatusSchema.optional().catch(undefined).parse(search.status),
  }
}

export function parseAdminProductSearch(search: Record<string, unknown>): AdminProductSearch {
  return {
    ...parseAdminListSearch(search),
    status: productStatusSchema.optional().catch(undefined).parse(search.status),
  }
}

export function parseAdminMessageSearch(search: Record<string, unknown>): AdminMessageSearch {
  return {
    filter: messageFilterSchema.optional().catch(undefined).parse(search.filter),
    page: page(search.page),
  }
}

/** Pages start at one; the query modules want a number, not an optional. */
export function resolveAdminPage(search: { page?: number | undefined }): number {
  return search.page ?? 1
}
