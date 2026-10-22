import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { Result } from 'effect'
import { toValidator, CooperationMessage, EnquiryMessage, ReportMessage } from '#/api/schemas'
// (inlined)

import type { DomainError } from '../errors'
import { RateLimitedError } from '../errors'
import { getDb } from '../db/client'
import { contactMessage, product, store } from '../db/schema'
import { user } from '../db/auth-schema'
import { eq } from 'drizzle-orm'
import { sendEnquiryNotification } from '../notifications'
import { runEffect } from '../runtime'
import { Env } from '../services/env'
import { RateLimiter } from '../services/rate-limit'

const MIN_FILL_TIME_MS = 1_500
const IP_QUOTA = { windowSeconds: 60 * 60, max: 5 }

export const submitCooperationMessage = createServerFn({
  method: 'POST',
  strict: { output: false },
})
  .validator(toValidator(CooperationMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (data.honeypot || Date.now() - data.startedAt < MIN_FILL_TIME_MS) {
      return Result.succeed(null)
    }

    const verdict = await runEffect(
      Effect.gen(function* () {
        const rl = yield* RateLimiter
        return yield* rl.consume({ key: `cooperation:${ip ?? 'unknown'}`, ...IP_QUOTA })
      }),
    )
    if (!verdict.allowed) {
      return Result.fail(
        new RateLimitedError({
          message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.',
          retryAfterSeconds: 3600,
        }),
      )
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

    return Result.succeed(null)
  })

export const submitEnquiry = createServerFn({ method: 'POST', strict: { output: false } })
  .validator(toValidator(EnquiryMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const ip = getRequestHeader('cf-connecting-ip')

    if (Date.now() - data.startedAt < MIN_FILL_TIME_MS) {
      return Result.succeed(null)
    }

    const verdict = await runEffect(
      Effect.gen(function* () {
        const rl = yield* RateLimiter
        return yield* rl.consume({ key: `enquiry:${ip ?? 'unknown'}`, ...IP_QUOTA })
      }),
    )
    if (!verdict.allowed) {
      return Result.fail(
        new RateLimitedError({
          message: 'Примено е премногу пораки од вашата адреса. Обидете се повторно подоцна.',
          retryAfterSeconds: 3600,
        }),
      )
    }

    const messageId = crypto.randomUUID()

    await getDb()
      .insert(contactMessage)
      .values({
        id: messageId,
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

    // Notify the producer. The email is best-effort: a delivery problem must
    // not undo the enquiry that was just saved.
    const storeRows = await getDb()
      .select({ name: store.name, ownerId: store.ownerId })
      .from(store)
      .where(eq(store.id, data.storeId))
      .limit(1)

    const storeRow = storeRows[0]

    if (storeRow) {
      const ownerRows = await getDb()
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, storeRow.ownerId))
        .limit(1)

      const ownerEmail = ownerRows[0]?.email

      if (ownerEmail) {
        const productTitle = data.productId
          ? ((
              await getDb()
                .select({ title: product.title })
                .from(product)
                .where(eq(product.id, data.productId))
                .limit(1)
            )[0]?.title ?? null)
          : null

        const appUrl =
          (await runEffect(
            Effect.gen(function* () {
              const e = yield* Env
              return e.APP_URL
            }),
          )) ?? ''

        await runEffect(
          sendEnquiryNotification({
            to: ownerEmail,
            storeName: storeRow.name,
            productName: productTitle,
            enquirerName: data.name,
            enquirerEmail: data.email,
            message: data.message,
            appUrl,
          }),
        ).catch(() => undefined)
      }
    }

    return Result.succeed(null)
  })

export const submitReport = createServerFn({ method: 'POST', strict: { output: false } })
  .validator(toValidator(ReportMessage))
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const ip = getRequestHeader('cf-connecting-ip')

    await getDb()
      .insert(contactMessage)
      .values({
        id: crypto.randomUUID(),
        kind: 'report',
        name: 'Пријава',
        email: 'noreply@ednaemajka.mk',
        message: data.reason,
        ip,
        userAgent: getRequestHeader('user-agent'),
        storeId: data.storeId ?? null,
        productId: data.productId ?? null,
      })

    return Result.succeed(null)
  })
