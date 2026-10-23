/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Schema } from 'effect'

import { InStockFlag, ProductAvailability, ProductSort, SortDirection } from './common'

export const ProductListFilters = Schema.Struct({
  sort: ProductSort.pipe(Schema.withDecodingDefault(Effect.succeed('newest' as any))),
  direction: SortDirection.pipe(Schema.withDecodingDefault(Effect.succeed('desc' as any))),
  categorySlug: Schema.optional(Schema.String),
  categorySlugs: Schema.optional(Schema.String),
  storeId: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(1)))),
  query: Schema.optional(
    Schema.Trim.pipe(Schema.check(Schema.isMinLength(2), Schema.isMaxLength(64))),
  ),
  minPrice: Schema.optional(Schema.NumberFromString),
  maxPrice: Schema.optional(Schema.NumberFromString),
  inStock: InStockFlag,
  /** Keeps the pinned products out of the list, for the home page. */
  excludeFeatured: Schema.optional(Schema.Boolean),
  page: Schema.NumberFromString.pipe(
    Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(500)),
    Schema.withDecodingDefault(Effect.succeed('1' as any)),
  ),
})

export type ProductListFilters = Schema.Schema.Type<typeof ProductListFilters>

export const ProductId = Schema.Struct({
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const ToggleFeatured = Schema.Struct({
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  featured: Schema.Boolean,
})

export const ManageProducts = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  page: Schema.NumberFromString.pipe(
    Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(500)),
    Schema.withDecodingDefault(Effect.succeed('1' as any)),
  ),
})

export const ManageProduct = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const ProductStatusSchema = Schema.Struct({
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  archived: Schema.Boolean,
})

export const ProductDelete = Schema.Struct({
  productId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const ProductImageAlt = Schema.Struct({
  imageId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  alt: Schema.String.pipe(Schema.check(Schema.isMaxLength(200))),
})

export const ProductVariantInput = Schema.Struct({
  title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(1), Schema.isMaxLength(60))),
  price: Schema.Number.pipe(
    Schema.check(
      Schema.isInt(),
      Schema.isGreaterThanOrEqualTo(1),
      Schema.isLessThanOrEqualTo(1_000_000),
    ),
  ),
})

export const ProductForm = Schema.Struct({
  productId: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(1)))),
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3), Schema.isMaxLength(160))),
  description: Schema.Trim.pipe(Schema.check(Schema.isMinLength(10), Schema.isMaxLength(4000))),
  categories: Schema.Array(Schema.String).pipe(Schema.check(Schema.isMinLength(1))),
  availability: ProductAvailability.pipe(
    Schema.withDecodingDefault(Effect.succeed('in_stock' as any)),
  ),
  variants: Schema.Array(ProductVariantInput).pipe(Schema.check(Schema.isMinLength(1))),
  attributes: Schema.optional(Schema.String),
})

export const ProductFormValues = Schema.Struct({
  title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3), Schema.isMaxLength(160))),
  description: Schema.Trim.pipe(Schema.check(Schema.isMinLength(10), Schema.isMaxLength(4000))),
  categories: Schema.Array(Schema.String).pipe(Schema.check(Schema.isMinLength(1))),
  availability: ProductAvailability,
  variants: Schema.Array(
    Schema.Struct({
      title: Schema.Trim.pipe(Schema.check(Schema.isMinLength(1), Schema.isMaxLength(60))),
      price: Schema.String.pipe(Schema.check(Schema.isPattern(/^\d{1,7}$/))),
    }),
  ).pipe(Schema.check(Schema.isMinLength(1))),
})
