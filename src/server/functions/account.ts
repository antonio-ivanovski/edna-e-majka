/**
 * The signed-in person's own account: the name on the account, the picture
 * next to it, and the account itself.
 *
 * There is no password anywhere in the app, so the account is protected by the
 * session alone.
 */
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { Result } from 'effect'
import type { DomainError } from '../errors'
import { NotSignedInError } from '../errors'

import { account, session, user } from '../db/auth-schema'
import { getDb } from '../db/client'
import { store } from '../db/schema'
import { withViewer } from '../middleware'
import { runEffect } from '../runtime'
import { deleteStoreCascade } from '../product-writes'
import { selectOwnerStore, selectOwnerProducts } from '../queries/manage'
import type { OwnerProduct } from '../queries/manage'

import { toValidator, Profile } from '#/api/schemas'
const profileSchema = toValidator(Profile)

export type AccountProfile = {
  id: string
  name: string
  email: string
  image: string | null
}

/** The account of the signed-in person. */
export const getAccount = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .handler(async ({ context }): Promise<AccountProfile> => {
    const viewer = context.viewer

    if (!viewer) {
      throw notFound()
    }

    const rows = await getDb()
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, viewer.id))
      .limit(1)

    const row = rows[0]

    if (!row) {
      throw notFound()
    }

    return row
  })

/** Renames the account. The picture is changed through the upload route. */
export const updateAccount = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator(profileSchema)
  .handler(async ({ context, data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer

    if (!viewer) {
      return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    }

    await getDb().update(user).set({ name: data.name.trim() }).where(eq(user.id, viewer.id))

    return Result.succeed(null)
  })

/**
 * Closes the account for good: the shop it holds, its listings and their
 * photos, the sessions and the account itself.
 */

export const exportUserData = createServerFn({ method: 'GET' })
  .middleware([withViewer])
  .handler(async ({ context }) => {
    const viewer = context.viewer
    if (!viewer) return null

    const db = getDb()
    const ownStore = await runEffect(selectOwnerStore(viewer.id))

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, viewer.id))
      .limit(1)

    const account = rows[0] ?? null

    let products: OwnerProduct[] = []

    if (ownStore) {
      products = (await runEffect(selectOwnerProducts(ownStore.id)))
        .items as OwnerProduct[]
    }

    return { account, store: ownStore, products }
  })

export const deleteAccount = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .handler(async ({ context }): Promise<Result.Result<null, DomainError>> => {
    const viewer = context.viewer

    if (!viewer) {
      return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    }

    const db = getDb()
    const ownStore = await runEffect(selectOwnerStore(viewer.id))

    if (ownStore) {
      await runEffect(deleteStoreCascade(ownStore.id))
    }

    await db.delete(session).where(eq(session.userId, viewer.id))
    await db.delete(account).where(eq(account.userId, viewer.id))
    await db.delete(store).where(eq(store.ownerId, viewer.id))
    await db.delete(user).where(eq(user.id, viewer.id))

    return Result.succeed(null)
  })

/** The shop the account holds, if any: shown before the account is closed. */
export const getAccountStore = createServerFn({ method: 'GET', strict: { output: false } })
  .middleware([withViewer])
  .handler(async ({ context }) => {
    const viewer = context.viewer

    if (!viewer) {
      return null
    }

    const ownStore = await runEffect(selectOwnerStore(viewer.id))

    return ownStore ? { id: ownStore.id, name: ownStore.name } : null
  })
