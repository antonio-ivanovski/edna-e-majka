import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'

import { toValidator } from '#/api/schemas'
import { Schema } from 'effect'

import { notification } from '../db/schema'
import { getDb } from '../db/client'
import { withViewer } from '../middleware'
import type { DomainError } from '../errors'
import { Result } from 'effect'

const markReadSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.check(Schema.isMinLength(1))),
})

export const listNotifications = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .handler(async ({ context }) => {
    const viewer = context.viewer
    if (!viewer) return []

    return getDb()
      .select({
        id: notification.id,
        kind: notification.kind,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })
      .from(notification)
      .where(eq(notification.userId, viewer.id))
      .orderBy(desc(notification.createdAt))
      .limit(30)
  })

export const markNotificationRead = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(toValidator(markReadSchema))
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.succeed(null)

    await getDb()
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.id, data.id), eq(notification.userId, viewer.id)))

    return Result.succeed(null)
  })

export const markAllNotificationsRead = createServerFn({
  method: 'POST',
  strict: { output: false },
})
  .middleware([withViewer])
  .handler(async ({ context }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer
    if (!viewer) return Result.succeed(null)

    await getDb()
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.userId, viewer.id)))

    return Result.succeed(null)
  })

export async function createNotification(input: {
  userId: string
  kind: string
  title: string
  body?: string
  link?: string
}): Promise<void> {
  await getDb()
    .insert(notification)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    })
}
