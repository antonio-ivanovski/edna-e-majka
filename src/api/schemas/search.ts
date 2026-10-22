/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Schema } from 'effect'

import { ProductSort, SortDirection } from './common'

export const ProductSearch = Schema.Struct({
  sort: ProductSort.pipe(Schema.withDecodingDefault(Effect.succeed('newest' as any))),
  direction: SortDirection.pipe(Schema.withDecodingDefault(Effect.succeed('desc' as any))),
  page: Schema.Union([Schema.Number, Schema.NumberFromString]).pipe(
    Schema.withDecodingDefault(Effect.succeed(1 as any)),
  ),
  minPrice: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
  maxPrice: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
  inStock: Schema.optional(Schema.String),
  categorySlugs: Schema.optional(Schema.String),
})

export const SearchPageSearch = Schema.Struct({
  ...ProductSearch.fields,
  q: Schema.optional(Schema.String),
})

export const AdminListSearch = Schema.Struct({
  q: Schema.optional(Schema.String),
  page: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
})

export const AdminStoreSearch = Schema.Struct({
  status: Schema.optional(Schema.Literals(['pending', 'active', 'suspended', 'archived'])),
  q: Schema.optional(Schema.String),
  page: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
})

export const AdminProductSearch = Schema.Struct({
  status: Schema.optional(Schema.Literals(['published', 'archived'])),
  q: Schema.optional(Schema.String),
  page: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
})

export const AdminMessageSearch = Schema.Struct({
  filter: Schema.optional(Schema.Literals(['open', 'done', 'all'])),
  page: Schema.optional(Schema.Union([Schema.Number, Schema.NumberFromString])),
})
