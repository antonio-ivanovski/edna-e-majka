/**
 * Better Auth's own tables.
 *
 * Hand-written to match what Better Auth 1.7 expects, using the shape its own
 * Drizzle generator produces: JavaScript property names are camelCase and MUST
 * equal Better Auth's field names (the adapter resolves columns by property
 * name), while the SQL column names are snake_case.
 *
 * Do not rename properties here without checking the library, and keep the
 * columns in sync with `betterAuth(...)` in `#/server/auth.ts` — Better Auth
 * validates this schema against its expectations on every auth request.
 */
import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** Milliseconds since the epoch, the format Better Auth writes for date fields. */
const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(now)
    .$onUpdate(() => new Date()),
}

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  /** Application role. Declared to Better Auth in `user.additionalFields`. */
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  ...timestamps,
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    ...timestamps,
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

/**
 * Only used when `rateLimit.storage` is `"database"`.
 *
 * Better Auth's rate limiter inserts `key`, `count` and `lastRequest` only, so
 * unlike every other table the id cannot be supplied by the caller and needs a
 * default here. `count` and `lastRequest` are plain integers — the limiter
 * passes `Date.now()`, not a `Date`.
 */
export const rateLimit = sqliteTable('rateLimit', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('last_request').notNull(),
})
