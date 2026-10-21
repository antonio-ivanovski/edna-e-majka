import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { Effect } from 'effect'
import { Result } from 'effect'
import { toValidator, CooperationMessage, EnquiryMessage } from '#/api/schemas'
// (inlined)

import type { DomainError } from '../errors'
import { RateLimitedError } from '../errors'
import { getDb } from '../db/client'
import { contactMessage } from '../db/schema'
import { runEffect } from '../runtime'
import { RateLimiter } from '../services/rate-limit'

const MIN_FILL_TIME_MS = 1_500
const IP_QUOTA = { windowSeconds: 60 * 60, max: 5 }

export const submitCooperationMessage = createServerFn({ method: 'POST', strict: { output: false } })
  .validator(toValidator(CooperationMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (data.honeypot || Date.now() - data.startedAt < MIN_FILL_TIME_MS) {
      return Result.succeed(null)
    }

    const verdict = await runEffect(Effect.gen(function* () { const rl = yield* RateLimiter; return yield* rl.consume({ key: `cooperation:${ip ?? 'unknown'}`, ...IP_QUOTA }) }))
    if (!verdict.allowed) {
      return Result.fail(new RateLimitedError({ message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.', retryAfterSeconds: 3600 }))
    }

    await getDb().insert(contactMessage).values({
      id: crypto.randomUUID(),
      kind: 'cooperation',
      name: data.name,
      email: data.email,
      phone: data.phone,
      website: data.website || null,
      message: data.message ?? '',
      ip,
      userAgent: getRequestHeader('user-agent'),
    })

    return Result.succeed(null)
  })

export const submitEnquiry = createServerFn({ method: 'POST', strict: { output: false } })
  .validator(toValidator(EnquiryMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (Date.now() - data.startedAt < MIN_FILL_TIME_MS) {
      return Result.succeed(null)
    }

    const verdict = await runEffect(Effect.gen(function* () { const rl = yield* RateLimiter; return yield* rl.consume({ key: `enquiry:${ip ?? 'unknown'}`, ...IP_QUOTA }) }))
    if (!verdict.allowed) {
      return Result.fail(new RateLimitedError({ message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.', retryAfterSeconds: 3600 }))
    }

    await getDb().insert(contactMessage).values({
      id: crypto.randomUUID(),
      kind: 'contact',
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      ip,
      userAgent: getRequestHeader('user-agent'),
      storeId: data.storeId,
      productId: data.productId ?? null,
    })

    return Result.succeed(null)
  })
