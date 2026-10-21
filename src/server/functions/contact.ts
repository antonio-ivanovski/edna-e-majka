import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { Effect } from 'effect'
import { toValidator, CooperationMessage, EnquiryMessage } from '#/api/schemas'
import { submittedTooFast } from '#/lib/clock'

import { getDb } from '../db/client'
import { contactMessage } from '../db/schema'
import { runEffect } from '../runtime'
import { RateLimiter } from '../services/rate-limit'

export type CooperationResult = { ok: true } | { ok: false; message: string }
export type EnquiryResult = { ok: true } | { ok: false; message: string }

const MIN_FILL_TIME_MS = 1_500
const IP_QUOTA = { windowSeconds: 60 * 60, max: 5 }

export const submitCooperationMessage = createServerFn({ method: 'POST' })
  .validator(toValidator(CooperationMessage))
  .handler(async ({ data }): Promise<CooperationResult> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (data.honeypot || submittedTooFast(data.startedAt, MIN_FILL_TIME_MS)) {
      return { ok: true }
    }

    const verdict = await runEffect(Effect.gen(function* () { const rl = yield* RateLimiter; return yield* rl.consume({ key: `cooperation:${ip ?? 'unknown'}`, ...IP_QUOTA }) }))
    if (!verdict.allowed) {
      return { ok: false, message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.' }
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

    return { ok: true }
  })

export const submitEnquiry = createServerFn({ method: 'POST' })
  .validator(toValidator(EnquiryMessage))
  .handler(async ({ data }): Promise<EnquiryResult> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (submittedTooFast(data.startedAt, MIN_FILL_TIME_MS)) {
      return { ok: true }
    }

    const verdict = await runEffect(Effect.gen(function* () { const rl = yield* RateLimiter; return yield* rl.consume({ key: `enquiry:${ip ?? 'unknown'}`, ...IP_QUOTA }) }))
    if (!verdict.allowed) {
      return { ok: false, message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.' }
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

    return { ok: true }
  })
