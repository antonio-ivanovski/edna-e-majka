/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect, Schema } from 'effect'

import { StoreStatus } from './common'

const storeDetailsFields = {
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3), Schema.isMaxLength(120))),
  description: Schema.Trim.pipe(Schema.check(Schema.isMinLength(30), Schema.isMaxLength(4000))),
  email: Schema.String.pipe(
    Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Schema.isMaxLength(200)),
  ),
  phone: Schema.Trim.pipe(Schema.check(Schema.isMinLength(6), Schema.isMaxLength(60))),
  facebook: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(300)))),
  instagram: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(300)))),
  city: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(120)))),
  hours: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(200)))),
}

export const StoreDetails = Schema.Struct(storeDetailsFields)

export const StoreId = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const StoreUpdate = Schema.Struct({
  ...storeDetailsFields,
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const AdminStoreStatus = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  status: StoreStatus,
  note: Schema.optional(Schema.NullOr(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(500))))),
})

export const AdminStoreDetails = Schema.Struct({
  ...storeDetailsFields,
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const AdminTransferStore = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),
})

const pageField = Schema.Union([Schema.Number, Schema.NumberFromString]).pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(500)),
  Schema.withDecodingDefault(Effect.succeed(1 as any)),
)

export const AdminStoreList = Schema.Struct({
  status: Schema.optional(StoreStatus),
  query: Schema.optional(
    Schema.Trim.pipe(Schema.check(Schema.isMinLength(1), Schema.isMaxLength(64))),
  ),
  page: pageField,
})

export const AdminUserList = Schema.Struct({
  query: Schema.optional(
    Schema.Trim.pipe(Schema.check(Schema.isMinLength(1), Schema.isMaxLength(64))),
  ),
  page: pageField,
})

export const AdminMessageList = Schema.Struct({
  filter: Schema.Literals(['open', 'done', 'all']).pipe(
    Schema.withDecodingDefault(Effect.succeed('open' as any)),
  ),
  page: pageField,
})

export const AdminProductList = Schema.Struct({
  status: Schema.optional(Schema.Literals(['published', 'archived'])),
  query: Schema.optional(
    Schema.Trim.pipe(Schema.check(Schema.isMinLength(1), Schema.isMaxLength(64))),
  ),
  page: pageField,
})

export const AdminUserRole = Schema.Struct({
  userId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  role: Schema.Literals(['user', 'admin']),
})

export const AdminMessageHandled = Schema.Struct({
  messageId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  handled: Schema.Boolean,
})

export const AdminMessage = Schema.Struct({
  messageId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})
