import { z } from 'zod'

import { categorySlugSchema } from './categories'

/** Shown in the "Подредување" menu. */
export const productSortSchema = z.enum(['newest', 'alpha', 'price'])

export type ProductSort = z.infer<typeof productSortSchema>

export const sortDirectionSchema = z.enum(['asc', 'desc'])

export type SortDirection = z.infer<typeof sortDirectionSchema>

/** A search term shorter than this matches too much to be useful. */
export const MIN_SEARCH_LENGTH = 2

/**
 * Input of every product list: the home page, a category, a producer and the
 * search page all call the same server function with different filters.
 *
 * `page` is coerced because the same schema validates URL search params, where
 * everything arrives as a string.
 */
export const productListFiltersSchema = z.object({
  sort: productSortSchema.default('newest'),
  direction: sortDirectionSchema.default('desc'),
  categorySlug: categorySlugSchema.optional(),
  storeId: z.string().min(1).optional(),
  query: z.string().trim().min(MIN_SEARCH_LENGTH).max(64).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
})

export type ProductListFilters = z.infer<typeof productListFiltersSchema>

export const productIdSchema = z.object({ productId: z.string().min(1) })

/**
 * The cooperation form behind the amber bar. `honeypot` and `startedAt` are the
 * abuse signals that replace a captcha: a hidden field nobody types into, and
 * the moment the form was rendered.
 */
export const cooperationMessageSchema = z.object({
  name: z.string().trim().min(2, 'Ве молиме внесете го вашето име.').max(120),
  email: z.email('Ве молиме внесете валидна е-маил адреса.').max(200),
  phone: z.string().trim().min(3, 'Ве молиме внесете вашиот телефонски број.').max(60),
  website: z.string().trim().max(300).optional(),
  message: z.string().trim().max(4000).optional(),
  honeypot: z.string().max(0).default(''),
  startedAt: z.coerce.number(),
})

export type CooperationMessage = z.infer<typeof cooperationMessageSchema>

export const storeIdSchema = z.object({ storeId: z.string().min(1) })
