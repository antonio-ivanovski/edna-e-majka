import { drizzle } from 'drizzle-orm/d1'

import * as authSchema from './auth-schema'
import * as schema from './schema'

import { workerEnv } from '../worker-env'

/** Tables keyed by Better Auth's model names, as its Drizzle adapter expects. */
export const authTables = authSchema

/**
 * D1 client. `env` is injected per request on Workers, so this is called from
 * inside handlers and loaders rather than at module scope.
 */
export function getDb() {
  return drizzle(workerEnv().DB, { schema: { ...schema, ...authSchema } })
}
