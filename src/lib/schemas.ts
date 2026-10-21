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

/**
 * What a producer fills in about their shop, on the application form and when
 * editing it later. Facebook and Instagram stay free text: producers paste
 * whatever their profile page shows, and `externalUrl` decides what is safe.
 */
export const storeDetailsSchema = z.object({
  name: z.string().trim().min(3, 'Внесете го името на продавницата.').max(120),
  description: z.string().trim().min(30, 'Опишете ја продавницата со барем 30 знаци.').max(4000),
  email: z.email('Ве молиме внесете валидна е-маил адреса.').max(200),
  phone: z.string().trim().min(6, 'Внесете телефонски број.').max(60),
  facebook: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(300).optional(),
})

export type StoreDetails = z.infer<typeof storeDetailsSchema>

export const storeUpdateSchema = storeDetailsSchema.extend({ storeId: z.string().min(1) })

/**
 * A product, with the packagings it is sold in. Every listing has at least one
 * variant: the price a card shows is the cheapest of them.
 */
export const productFormSchema = z.object({
  /** Absent while the product is being created. */
  productId: z.string().min(1).optional(),
  storeId: z.string().min(1),
  title: z.string().trim().min(3, 'Внесете наслов на производот.').max(160),
  description: z.string().trim().min(10, 'Опишете го производот.').max(4000),
  categories: z.array(categorySlugSchema).min(1, 'Изберете барем една категорија.'),
  variants: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Внесете го пакувањето.').max(60),
        price: z.coerce
          .number()
          .int('Цената е цел број денари.')
          .min(1, 'Внесете цена.')
          .max(1_000_000),
      }),
    )
    .min(1, 'Додајте барем едно пакување со цена.'),
})

export type ProductForm = z.infer<typeof productFormSchema>

/**
 * The same product as the form collects it. The price is typed as digits and
 * becomes a number on submit, so the message can be about denars instead of
 * about a value that failed to parse.
 */
export const productFormValuesSchema = z.object({
  title: z.string().trim().min(3, 'Внесете наслов на производот.').max(160),
  description: z.string().trim().min(10, 'Опишете го производот.').max(4000),
  categories: z.array(categorySlugSchema).min(1, 'Изберете барем една категорија.'),
  variants: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Внесете го пакувањето.').max(60),
        price: z
          .string()
          .trim()
          .regex(/^\d{1,7}$/, 'Внесете цена во денари, само бројки.'),
      }),
    )
    .min(1, 'Додајте барем едно пакување со цена.'),
})

export type ProductFormValues = z.infer<typeof productFormValuesSchema>

export const productStatusSchema = z.object({
  productId: z.string().min(1),
  archived: z.boolean(),
})

export const productDeleteSchema = z.object({ productId: z.string().min(1) })

/** A product is always addressed together with the shop that holds it. */
export const manageProductSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
})

/**
 * The moderation decision. `note` is left out when an action should keep the
 * note already on the shop, and sent as null when the note is cleared.
 */
export const adminStoreStatusSchema = z.object({
  storeId: z.string().min(1),
  status: z.enum(['pending', 'active', 'suspended', 'archived']),
  note: z.string().trim().max(500).nullable().optional(),
})

/** An admin edits the same details the owner does. */
export const adminStoreDetailsSchema = storeDetailsSchema.extend({
  storeId: z.string().min(1),
})

export const adminTransferStoreSchema = z.object({
  storeId: z.string().min(1),
  email: z.email('Внесете валидна е-маил адреса.'),
})

export const adminUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['user', 'admin']),
})

export const adminMessageSchema = z.object({ messageId: z.string().min(1) })

export const adminMessageHandledSchema = z.object({
  messageId: z.string().min(1),
  handled: z.boolean(),
})
