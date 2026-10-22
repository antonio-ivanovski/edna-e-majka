import { Schema } from 'effect'

/**
 * Domain errors returned by Effect programs. They are tagged so callers can
 * recover with `Effect.catchTag`/`Effect.catchTags` and so they serialise
 * cleanly across the TanStack Start boundary.
 */
export class NotFoundError extends Schema.TaggedError<NotFoundError>()('NotFoundError', {
  message: Schema.String,
}) {}

export class NotAllowedError extends Schema.TaggedError<NotAllowedError>()('NotAllowedError', {
  message: Schema.String,
}) {}

export class NotSignedInError extends Schema.TaggedError<NotSignedInError>()('NotSignedInError', {
  message: Schema.String,
}) {}

export class InvalidInputError extends Schema.TaggedError<InvalidInputError>()(
  'InvalidInputError',
  {
    message: Schema.String,
  },
) {}

export class RateLimitedError extends Schema.TaggedError<RateLimitedError>()('RateLimitedError', {
  message: Schema.String,
  retryAfterSeconds: Schema.Number,
}) {}

export class StorageError extends Schema.TaggedError<StorageError>()('StorageError', {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export class EmailError extends Schema.TaggedError<EmailError>()('EmailError', {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()('DatabaseError', {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

/** Union of every domain error that a server function can surface to the client. */
export type DomainError =
  | NotFoundError
  | NotAllowedError
  | NotSignedInError
  | InvalidInputError
  | RateLimitedError
  | StorageError
  | EmailError
  | DatabaseError
