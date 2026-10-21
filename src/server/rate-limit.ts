import { sql } from 'drizzle-orm'

import { getDb } from './db/client'

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number }

/**
 * Fixed-window counter backed by D1, for limits Better Auth's own rate limiter
 * cannot express — it keys on IP and path only, while magic-link abuse is best
 * limited per recipient address.
 *
 * One statement keeps it atomic under concurrency: the insert starts the
 * window, the conflict branch decides whether the window has rolled over and
 * returns the resulting count. Rows are reused, so they do not accumulate.
 */
export async function consumeRateLimit({
  key,
  windowSeconds,
  max,
}: {
  key: string
  windowSeconds: number
  max: number
}): Promise<RateLimitVerdict> {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const rows = await getDb().all<{ count: number; last_request: number }>(sql`
    INSERT INTO rateLimit (id, key, count, last_request)
    VALUES (${crypto.randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN ${now} - rateLimit.last_request >= ${windowMs} THEN 1
        ELSE rateLimit.count + 1
      END,
      last_request = CASE
        WHEN ${now} - rateLimit.last_request >= ${windowMs} THEN ${now}
        ELSE rateLimit.last_request
      END
    RETURNING count, last_request
  `)

  const row = rows[0]
  if (!row) {
    throw new Error('Rate limit counter returned no row.')
  }

  if (row.count > max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((row.last_request + windowMs - now) / 1000)),
    }
  }

  return { allowed: true }
}
