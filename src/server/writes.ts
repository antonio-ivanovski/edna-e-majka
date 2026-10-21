import { Effect } from 'effect'
import { eq } from 'drizzle-orm'

import { Db } from './services/db'
import { NotAllowedError, NotFoundError } from './errors'
import { store } from './db/schema'
import { optionalText } from '#/lib/text'
import { StoreDetails } from '#/api/schemas/stores'

type StoreDetailsType = typeof StoreDetails.Type

export type Actor = { kind: 'owner'; id: string } | { kind: 'admin'; id: string }

export const updateStoreDetails = Effect.fn('updateStoreDetails')(function* (
  storeId: string,
  data: StoreDetailsType,
  actor: Actor,
) {
  const db = yield* Db
  const rows = yield* db.run((d) => d.select({ id: store.id, ownerId: store.ownerId }).from(store).where(eq(store.id, storeId)).limit(1))
  const found = rows[0]
  if (!found) return yield* new NotFoundError({ message: 'Продавницата не е најдена.' })
  if (actor.kind === 'owner' && found.ownerId !== actor.id) {
    return yield* new NotAllowedError({ message: 'Немате дозвола за оваа акција.' })
  }
  yield* db.run((d) =>
    d.update(store).set({
      name: data.name,
      description: data.description,
      email: data.email,
      phone: data.phone,
      facebook: optionalText(data.facebook),
      instagram: optionalText(data.instagram),
      city: optionalText(data.city),
      hours: optionalText(data.hours),
    }).where(eq(store.id, storeId)),
  )
})

export const setStoreStatus = Effect.fn('setStoreStatus')(function* (
  storeId: string,
  status: 'pending' | 'active' | 'suspended' | 'archived',
  note: string | null | undefined,
  actor: Actor,
) {
  const db = yield* Db
  const rows = yield* db.run((d) => d.select({ id: store.id }).from(store).where(eq(store.id, storeId)).limit(1))
  if (!rows[0]) return yield* new NotFoundError({ message: 'Продавницата не е најдена.' })
  yield* db.run((d) =>
    d.update(store).set({
      status,
      ...(note === undefined ? {} : { statusNote: note || null }),
      reviewedBy: actor.id,
      reviewedAt: new Date(),
    }).where(eq(store.id, storeId)),
  )
})


