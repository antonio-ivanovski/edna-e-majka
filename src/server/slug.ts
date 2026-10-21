import { Effect } from 'effect'
import { eq, like, or } from 'drizzle-orm'

import { slugify, uniqueSlug } from '#/lib/slug'
import { Db } from './services/db'
import { type DatabaseError } from './errors'
import { product, store } from './db/schema'

export const claimProductSlug = Effect.fn('claimProductSlug')(function* (title: string): Effect.fn.Return<string, DatabaseError, Db> {
  const base = slugify(title)
  const db = yield* Db
  const rows = yield* db.run((d) => d.select({ slug: product.slug }).from(product).where(or(eq(product.slug, base), like(product.slug, `${base}-%`))))
  const taken = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s))
  return uniqueSlug(base, (candidate) => taken.has(candidate))
})

export const claimStoreSlug = Effect.fn('claimStoreSlug')(function* (name: string): Effect.fn.Return<string, DatabaseError, Db> {
  const base = slugify(name)
  const db = yield* Db
  const rows = yield* db.run((d) => d.select({ slug: store.slug }).from(store).where(or(eq(store.slug, base), like(store.slug, `${base}-%`))))
  const taken = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s))
  return uniqueSlug(base, (candidate) => taken.has(candidate))
})
