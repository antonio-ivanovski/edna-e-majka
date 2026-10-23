import { Schema } from 'effect'

import {
  InStockFlag,
  LenientDirection,
  LenientOptionalString,
  LenientPage,
  LenientPrice,
  LenientSort,
} from './common'

export const ProductSearch = Schema.Struct({
  sort: LenientSort,
  direction: LenientDirection,
  page: LenientPage,
  minPrice: LenientPrice,
  maxPrice: LenientPrice,
  inStock: InStockFlag,
  categorySlugs: LenientOptionalString,
})

export const SearchPageSearch = Schema.Struct({
  ...ProductSearch.fields,
  q: LenientOptionalString,
})

export const AdminListSearch = Schema.Struct({
  q: LenientOptionalString,
  page: LenientPage,
})

export const AdminStoreSearch = Schema.Struct({
  status: Schema.optional(Schema.Literals(['pending', 'active', 'suspended', 'archived'])),
  q: LenientOptionalString,
  page: LenientPage,
})

export const AdminProductSearch = Schema.Struct({
  status: Schema.optional(Schema.Literals(['published', 'archived'])),
  q: LenientOptionalString,
  page: LenientPage,
})

export const AdminMessageSearch = Schema.Struct({
  filter: Schema.optional(Schema.Literals(['open', 'done', 'all'])),
  page: LenientPage,
})

export const AdminAuditSearch = Schema.Struct({
  page: LenientPage,
})
