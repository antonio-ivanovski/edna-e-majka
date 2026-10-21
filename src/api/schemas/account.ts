import { Schema } from 'effect'

export const Profile = Schema.Struct({
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(1)), Schema.check(Schema.isMaxLength(120))),
})

export const AccountProfile = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  image: Schema.NullOr(Schema.String),
})
