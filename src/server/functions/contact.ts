import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { submittedTooFast } from '#/lib/clock'
import { cooperationMessageSchema, enquiryMessageSchema } from '#/lib/schemas'

import { getDb } from '../db/client'
import { contactMessage } from '../db/schema'
import { consumeRateLimit } from '../rate-limit'

/** A form that comes back faster than this was not filled in by a person. */
const MIN_FILL_TIME_MS = 1_500

const IP_QUOTA = { windowSeconds: 60 * 60, max: 5 }

export type CooperationResult = { ok: true } | { ok: false; message: string }

/**
 * Stores a cooperation enquiry for the admin dashboard. There is no outbound
 * mail: the inbox lives at `/admin/messages`.
 *
 * Rate limiting returns a value instead of throwing so the form can show the
 * message without tripping the route error boundary.
 */
export const submitCooperationMessage = createServerFn({ method: 'POST' })
  .validator(cooperationMessageSchema)
  .handler(async ({ data }): Promise<CooperationResult> => {
    const ip = getRequestHeader('cf-connecting-ip')

    // Bots get the same answer as people, so they learn nothing from it.
    if (data.honeypot || submittedTooFast(data.startedAt, MIN_FILL_TIME_MS)) {
      return { ok: true }
    }

    const verdict = await consumeRateLimit({
      key: `cooperation:${ip ?? 'unknown'}`,
      ...IP_QUOTA,
    })

    if (!verdict.allowed) {
      return {
        ok: false,
        message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.',
      }
    }

    await getDb()
      .insert(contactMessage)
      .values({
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

export type EnquiryResult = { ok: true } | { ok: false; message: string }

export const submitEnquiry = createServerFn({ method: 'POST' })
  .validator(enquiryMessageSchema)
  .handler(async ({ data }): Promise<EnquiryResult> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (submittedTooFast(data.startedAt, MIN_FILL_TIME_MS)) {
      return { ok: true }
    }

    const verdict = await consumeRateLimit({
      key: `enquiry:${ip ?? 'unknown'}`,
      ...IP_QUOTA,
    })

    if (!verdict.allowed) {
      return {
        ok: false,
        message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.',
      }
    }

    await getDb()
      .insert(contactMessage)
      .values({
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
