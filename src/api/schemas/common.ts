import { Effect, Schema, SchemaGetter } from 'effect'

import { MAX_CATALOGUE_ITEMS, PRODUCT_PAGE_SIZE } from '#/lib/pagination'

/** A trimmed, bounded string. */
export const TrimmedString = (min: number, max: number) =>
  Schema.Trim.pipe(Schema.check(Schema.isMinLength(min), Schema.isMaxLength(max)))

/**
 * One address shape for the whole app. The pattern is deliberately simple: a
 * local part, an `@`, a domain and a dotted suffix. Anything stricter starts
 * rejecting addresses that really do deliver.
 */
export const Email = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  Schema.check(Schema.isMaxLength(200)),
)

export const PageNumber = Schema.Number.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isGreaterThanOrEqualTo(1)),
  Schema.check(Schema.isLessThanOrEqualTo(500)),
)

/**
 * The in-stock flag arrives as a JSON-parsed search value, so a hand-typed
 * `?inStock=1` is the number `1` and `?inStock=true` is a boolean, while
 * navigation inside the app sends the string `'1'`. Every truthy spelling
 * normalises to the single `'1'` the catalogue query understands; anything
 * else means no filter rather than a broken page.
 */
export const InStockFlag = Schema.optional(
  Schema.Union([Schema.String, Schema.Number, Schema.Boolean]),
).pipe(
  Schema.decodeTo(Schema.optional(Schema.String), {
    decode: SchemaGetter.transform((value) =>
      value === '1' || value === 1 || value === true || value === 'true' ? '1' : undefined,
    ),
    encode: SchemaGetter.transform((value) => value),
  }),
)
export type InStockFlag = Schema.Schema.Type<typeof InStockFlag>

/** The last catalogue page the pager can reach. */
export const MAX_CATALOGUE_PAGE = Math.max(1, Math.ceil(MAX_CATALOGUE_ITEMS / PRODUCT_PAGE_SIZE))

const coercePage = (value: unknown): number => {
  const candidate =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(candidate)) return 1
  return Math.min(Math.max(candidate, 1), MAX_CATALOGUE_PAGE)
}

/**
 * A page number that never fails decoding. A hand-typed `?page=-1`, `1.5`,
 * `501` or `abc` normalises to a page the pager can actually show instead
 * of failing the route's search validation.
 */
export const LenientPage = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.Number, {
    decode: SchemaGetter.transform(coercePage),
    encode: SchemaGetter.transform((page: number) => page),
  }),
  Schema.withDecodingDefault(Effect.succeed(1)),
)

const coercePrice = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim() !== '') {
    const candidate = Number(value)
    return Number.isFinite(candidate) ? candidate : undefined
  }
  return undefined
}

/**
 * A price filter that drops garbage instead of failing validation:
 * `?minPrice=abc` means no minimum rather than a broken page.
 */
export const LenientPrice = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.optional(Schema.Number), {
    decode: SchemaGetter.transform(coercePrice),
    encode: SchemaGetter.transform((price: number | undefined) => price),
  }),
)

const coerceOptionalString = (value: unknown): string | undefined =>
  value == null ? undefined : typeof value === 'string' ? value : String(value)

/**
 * Text that arrives as a JSON-parsed search value, so a hand-typed `?q=123`
 * is the number `123` and `?categorySlugs=123` is the number `123`.
 * Everything stringifies; only a missing value means no filter.
 */
export const LenientOptionalString = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(Schema.optional(Schema.String), {
    decode: SchemaGetter.transform(coerceOptionalString),
    encode: SchemaGetter.transform((value: string | undefined) => value),
  }),
)

export const SortDirection = Schema.Literals(['asc', 'desc'])
export type SortDirection = Schema.Schema.Type<typeof SortDirection>

export const ProductSort = Schema.Literals(['newest', 'alpha', 'price'])
export type ProductSort = Schema.Schema.Type<typeof ProductSort>

/** Lenient sort/direction that never fail validation — garbage falls back. */
const coerceSort = (value: unknown): ProductSort =>
  value === 'alpha' || value === 'price' || value === 'newest' ? value : 'newest'

export const LenientSort = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(ProductSort, {
    decode: SchemaGetter.transform(coerceSort),
    encode: SchemaGetter.transform((value: ProductSort) => value),
  }),
  Schema.withDecodingDefault(Effect.succeed('newest' as ProductSort)),
)

const coerceDirection = (value: unknown): SortDirection =>
  value === 'asc' || value === 'desc' ? value : 'desc'

export const LenientDirection = Schema.optional(Schema.Unknown).pipe(
  Schema.decodeTo(SortDirection, {
    decode: SchemaGetter.transform(coerceDirection),
    encode: SchemaGetter.transform((value: SortDirection) => value),
  }),
  Schema.withDecodingDefault(Effect.succeed('desc' as SortDirection)),
)

export const MIN_SEARCH_LENGTH = 2

export const ProductAvailability = Schema.Literals(['in_stock', 'out_of_stock', 'on_order'])

export const StoreStatus = Schema.Literals(['pending', 'active', 'suspended', 'archived'])

export const ProductStatus = Schema.Literals(['published', 'archived'])

export const MessageFilter = Schema.Literals(['open', 'done', 'all'])

export const toValidator = <S extends Schema.ConstraintDecoder<unknown>>(schema: S) =>
  Schema.toStandardSchemaV1(schema)

export const AdminUserBan = Schema.Struct({
  userId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  banned: Schema.Boolean,
})

export const ModerationNote = Schema.Struct({
  storeId: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(1)))),
  productId: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(1)))),
  body: Schema.Trim.pipe(Schema.check(Schema.isMinLength(2), Schema.isMaxLength(1000))),
})
