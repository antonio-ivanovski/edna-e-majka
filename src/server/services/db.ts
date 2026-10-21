import { Context, Effect, Layer, Schema } from 'effect'

import { getDb } from '../db/client'
import { DatabaseError } from '../errors'

/**
 * Thin Effect wrapper around the Drizzle/D1 client. Drizzle itself is
 * synchronous to construct (it only binds to `env.DB`), so this is a `sync`
 * layer; the actual query execution happens inside `Effect.tryPromise`.
 */
export class Db extends Context.Service<Db, {
  readonly run: <A>(f: (db: ReturnType<typeof getDb>) => Promise<A>) => Effect.Effect<A, DatabaseError>
}>()('edna-e-majka/server/Db') {
  static readonly layer = Layer.sync(Db, () => {
    const db = getDb()
    return Db.of({
      run: (f) =>
        Effect.tryPromise({
          try: () => f(db),
          catch: (cause) => new DatabaseError({ message: 'Грешка при пристап до базата.', cause }),
        }),
    })
  })
}

export type DbService = Db['Service']
export { Schema }
