import { Context, Effect, Layer } from 'effect'

import { DatabaseError } from '../errors'

export interface RateLimitResult {
  readonly allowed: boolean
  readonly retryAfterSeconds: number
}

export interface RateLimiterService {
  readonly consume: (input: {
    readonly key: string
    readonly windowSeconds: number
    readonly max: number
  }) => Effect.Effect<RateLimitResult, DatabaseError>
}

import { env } from 'cloudflare:workers'

export class RateLimiter extends Context.Service<RateLimiter, RateLimiterService>()(
  'edna-e-majka/server/RateLimiter',
) {
  static readonly layer = Layer.sync(RateLimiter, () => {
    const consume: RateLimiterService['consume'] = (input) =>
      Effect.tryPromise({
        try: async () => {
          const now = Date.now()
          const windowStart = now - input.windowSeconds * 1000
          const stmt = env.DB.prepare(
            `INSERT INTO rate_limit (key, count, last_request) VALUES (?, 1, ?)
             ON CONFLICT(key) DO UPDATE SET
               count = CASE WHEN last_request < ? THEN 1 ELSE count + 1 END,
               last_request = ?
             RETURNING count, last_request`,
          ).bind(input.key, now, windowStart, now)
          const result = await stmt.first<{ count: number; last_request: number }>()
          if (!result) throw new Error('Rate limit counter returned no row.')
          const allowed = result.count <= input.max
          return {
            allowed,
            retryAfterSeconds: allowed ? 0 : input.windowSeconds,
          } satisfies RateLimitResult
        },
        catch: (cause) =>
          new DatabaseError({ message: 'Грешка при проверка на ограничувањето.', cause }),
      })

    return RateLimiter.of({ consume })
  })
}
