import { Schema, SchemaGetter } from 'effect'

import {
  InStockFlag,
  LenientAdminPage,
  LenientCataloguePage,
  LenientDirection,
  LenientOptionalString,
  LenientPrice,
  LenientSearchQuery,
  LenientSort,
  MessageFilter,
  ProductStatus,
  StoreStatus,
} from './common'

const coerceStoreStatus = (
  value: unknown,
): 'pending' | 'active' | 'suspended' | 'archived' | undefined =>
  value === 'pending' || value === 'active' || value === 'suspended' || value === 'archived'
    ? value
    : undefined

/** An unknown status means no filter rather than a broken page. */
export const LenientStoreStatus = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.optional(StoreStatus), {
    decode: SchemaGetter.transform(coerceStoreStatus),
    encode: SchemaGetter.transform(
      (value: 'pending' | 'active' | 'suspended' | 'archived' | undefined) => value,
    ),
  }),
)

const coerceProductStatus = (value: unknown): 'published' | 'archived' | undefined =>
  value === 'published' || value === 'archived' ? value : undefined

/** An unknown status means no filter rather than a broken page. */
export const LenientProductStatus = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.optional(ProductStatus), {
    decode: SchemaGetter.transform(coerceProductStatus),
    encode: SchemaGetter.transform((value: 'published' | 'archived' | undefined) => value),
  }),
)

const coerceMessageFilter = (value: unknown): 'open' | 'done' | 'all' | undefined =>
  value === 'open' || value === 'done' || value === 'all' ? value : undefined

/** An unknown filter means the default view rather than a broken page. */
export const LenientMessageFilter = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.optional(MessageFilter), {
    decode: SchemaGetter.transform(coerceMessageFilter),
    encode: SchemaGetter.transform((value: 'open' | 'done' | 'all' | undefined) => value),
  }),
)

export const ProductSearch = Schema.Struct({
  sort: LenientSort,
  direction: LenientDirection,
  page: LenientCataloguePage,
  minPrice: LenientPrice,
  maxPrice: LenientPrice,
  inStock: InStockFlag,
  categorySlugs: LenientOptionalString,
})

export const SearchPageSearch = Schema.Struct({
  ...ProductSearch.fields,
  q: LenientSearchQuery,
})

export const AdminListSearch = Schema.Struct({
  q: LenientOptionalString,
  page: LenientAdminPage,
})

export const AdminStoreSearch = Schema.Struct({
  status: LenientStoreStatus,
  q: LenientOptionalString,
  page: LenientAdminPage,
})

export const AdminProductSearch = Schema.Struct({
  status: LenientProductStatus,
  q: LenientOptionalString,
  page: LenientAdminPage,
  storeId: LenientOptionalString,
})

export const AdminMessageSearch = Schema.Struct({
  filter: LenientMessageFilter,
  page: LenientAdminPage,
})

export const AdminAuditSearch = Schema.Struct({
  page: LenientAdminPage,
  actorKind: LenientOptionalString,
  action: LenientOptionalString,
  targetType: LenientOptionalString,
})
