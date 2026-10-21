import { z } from 'zod'

import {
  productSortSchema,
  sortDirectionSchema,
  type ProductSort,
  type SortDirection,
} from './schemas'

/**
 * Search params are optional so that `/` and `/categories/med` stay clean URLs;
 * the defaults are applied when the loader builds its filters.
 */
export type ProductSearch = {
  sort?: ProductSort | undefined
  direction?: SortDirection | undefined
  page?: number | undefined
}

export type SearchPageSearch = ProductSearch & { q?: string | undefined }

export type ResolvedListParams = {
  sort: ProductSort
  direction: SortDirection
  page: number
}

/**
 * Each sort has a natural direction, so picking one never leaves the list in a
 * surprising order. The direction toggle is a step away from it.
 */
export function defaultDirection(sort: ProductSort): SortDirection {
  return sort === 'newest' ? 'desc' : 'asc'
}

const pageSchema = z.coerce.number().int().min(1).max(500)

/** Untrusted strings from the URL: fall back to "unset" instead of throwing. */
export function parseProductSearch(search: Record<string, unknown>): ProductSearch {
  return {
    sort: productSortSchema.optional().catch(undefined).parse(search.sort),
    direction: sortDirectionSchema.optional().catch(undefined).parse(search.direction),
    page: pageSchema.optional().catch(undefined).parse(search.page),
  }
}

export function resolveProductSearch(search: ProductSearch): ResolvedListParams {
  const sort = search.sort ?? 'newest'

  return {
    sort,
    direction: search.direction ?? defaultDirection(sort),
    page: search.page ?? 1,
  }
}

export function parseSearchPage(search: Record<string, unknown>): SearchPageSearch {
  const raw = typeof search.q === 'string' ? search.q.trim() : ''

  return {
    ...parseProductSearch(search),
    q: raw ? raw.slice(0, 64) : undefined,
  }
}
