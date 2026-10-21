import { Effect, Schema } from 'effect'

export const EnquiryMessage = Schema.Struct({
  storeId: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
  productId: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(1)))),
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(2), Schema.isMaxLength(120))),
  email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Schema.isMaxLength(200))),
  phone: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(60)))),
  message: Schema.Trim.pipe(Schema.check(Schema.isMinLength(10), Schema.isMaxLength(2000))),
  honeypot: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMaxLength(0)))),
  startedAt: Schema.Number,
})

export const CooperationMessage = Schema.Struct({
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(2), Schema.isMaxLength(120))),
  email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Schema.isMaxLength(200))),
  phone: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3), Schema.isMaxLength(60))),
  website: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(300)))),
  message: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(4000)))),
  honeypot: Schema.String.pipe(Schema.check(Schema.isMaxLength(0))).pipe(Schema.withDecodingDefault(Effect.succeed(''))),
  startedAt: Schema.NumberFromString,
})
