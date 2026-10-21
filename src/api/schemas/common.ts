import { Schema } from 'effect'

/** A trimmed, bounded string. */
export const TrimmedString = (min: number, max: number) =>
  Schema.Trim.pipe(Schema.check(Schema.isMinLength(min), Schema.isMaxLength(max)))

export const Email = Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)))

export const PageNumber = Schema.Number.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isGreaterThanOrEqualTo(1)),
  Schema.check(Schema.isLessThanOrEqualTo(500)),
)

export const SortDirection = Schema.Literals(['asc', 'desc'])
export type SortDirection = Schema.Schema.Type<typeof SortDirection>

export const ProductSort = Schema.Literals(['newest', 'alpha', 'price'])
export type ProductSort = Schema.Schema.Type<typeof ProductSort>

export const MIN_SEARCH_LENGTH = 2

export const ProductAvailability = Schema.Literals(['in_stock', 'out_of_stock', 'on_order'])

export const StoreStatus = Schema.Literals(['pending', 'active', 'suspended', 'archived'])

export const ProductStatus = Schema.Literals(['published', 'archived'])

export const MessageFilter = Schema.Literals(['open', 'done', 'all'])

export const toValidator = <S extends Schema.ConstraintDecoder<unknown>>(schema: S) =>
  Schema.toStandardSchemaV1(schema)
