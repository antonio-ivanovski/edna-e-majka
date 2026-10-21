import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'

import { env } from 'cloudflare:workers'

import { getDb } from '../db/client'
import { user } from '../db/auth-schema'
import { productImage, store } from '../db/schema'
import { withViewer } from '../middleware'
import { imageUrl } from '#/lib/images'
import { runEffect } from '../runtime'
import { Session } from '../services/session'
import { selectAdminProductRow, selectAdminStore } from '../queries/admin'
import {
  selectNextImagePosition,
  selectOwnedProductRow,
  selectOwnerStoreById,
} from '../queries/manage'

import { Result } from 'effect'
import type { DomainError } from '../errors'
import { NotAllowedError, NotFoundError, NotSignedInError } from '../errors'

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_EDGE = 20_000

function r2KeyOf(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/images/')) return url.slice('/images/'.length)
  const base = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '')
  if (base && url.startsWith(`${base}/`)) return url.slice(base.length + 1)
  return null
}

function dimension(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_EDGE ? parsed : fallback
}

async function getViewer() {
  return runEffect(
    Effect.gen(function* () {
      const s = yield* Session
      return yield* s.getViewer()
    }),
  )
}

export const uploadUserAvatar = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<Result.Result<{ key: string }, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

    const form = data as unknown as FormData
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return Result.fail(new NotAllowedError({ message: 'Изберете слика.' }))
    }
    const extension = EXTENSIONS[file.type]
    if (!extension)
      return Result.fail(
        new NotAllowedError({ message: 'Дозволени се само JPEG, PNG и WebP слики.' }),
      )
    if (file.size > MAX_UPLOAD_BYTES)
      return Result.fail(new NotAllowedError({ message: 'Сликата е преголема (најмногу 8 МБ).' }))

    const key = `users/${viewer.id}/avatar/${crypto.randomUUID()}.${extension}`
    const httpMetadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    }
    await env.BUCKET.put(key, file.stream(), { httpMetadata })

    const db = getDb()
    const rows = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, viewer.id))
      .limit(1)
    const oldKey = r2KeyOf(rows[0]?.image)
    if (oldKey) await env.BUCKET.delete(oldKey)
    await db
      .update(user)
      .set({ image: imageUrl(key) ?? `/images/${key}` })
      .where(eq(user.id, viewer.id))

    return Result.succeed({ key })
  })

export const uploadProductImage = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: FormData) => d)
  .handler(
    async ({
      data,
    }): Promise<
      Result.Result<
        { id: string; key: string; alt: string | null; width: number; height: number },
        DomainError
      >
    > => {
      const viewer = await getViewer()
      if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))

      const form = data as unknown as FormData
      const file = form.get('file')
      const productId = form.get('productId')
      if (!(file instanceof File) || file.size === 0)
        return Result.fail(new NotAllowedError({ message: 'Изберете слика.' }))
      const extension = EXTENSIONS[file.type]
      if (!extension)
        return Result.fail(
          new NotAllowedError({ message: 'Дозволени се само JPEG, PNG и WebP слики.' }),
        )
      if (file.size > MAX_UPLOAD_BYTES)
        return Result.fail(new NotAllowedError({ message: 'Сликата е преголема (најмногу 8 МБ).' }))

      if (typeof productId !== 'string' || !productId) {
        return Result.fail(new NotAllowedError({ message: 'Недостасува производ.' }))
      }

      const owned =
        viewer.role === 'admin'
          ? await runEffect(selectAdminProductRow(productId))
          : await runEffect(selectOwnedProductRow(productId, viewer.id))
      if (!owned)
        return Result.fail(new NotAllowedError({ message: 'Немате дозвола за овој производ.' }))

      const id = crypto.randomUUID()
      const key = `stores/${owned.storeId}/products/${productId}/${id}.${extension}`
      const httpMetadata = {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      }
      await env.BUCKET.put(key, file.stream(), { httpMetadata })

      const altRaw = form.get('alt')
      const alt = typeof altRaw === 'string' && altRaw.trim() ? altRaw.trim().slice(0, 200) : null
      const width = dimension(form.get('width'), 1200)
      const height = dimension(form.get('height'), 900)
      const position = await runEffect(selectNextImagePosition(productId))

      await getDb().insert(productImage).values({
        id,
        productId,
        r2Key: key,
        width,
        height,
        alt,
        position,
      })

      return Result.succeed({ id, key, alt, width, height })
    },
  )

export const uploadStoreAvatar = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<Result.Result<{ key: string }, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const form = data as unknown as FormData
    const file = form.get('file')
    const storeId = form.get('storeId')
    if (!(file instanceof File) || file.size === 0)
      return Result.fail(new NotAllowedError({ message: 'Изберете слика.' }))
    const extension = EXTENSIONS[file.type]
    if (!extension)
      return Result.fail(
        new NotAllowedError({ message: 'Дозволени се само JPEG, PNG и WebP слики.' }),
      )
    if (file.size > MAX_UPLOAD_BYTES)
      return Result.fail(new NotAllowedError({ message: 'Сликата е преголема (најмногу 8 МБ).' }))
    if (typeof storeId !== 'string' || !storeId)
      return Result.fail(new NotAllowedError({ message: 'Недостасува продавница.' }))

    const ownStore =
      viewer.role === 'admin'
        ? await runEffect(selectAdminStore(storeId))
        : await runEffect(selectOwnerStoreById(storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа продавница.' }))

    const key = `stores/${storeId}/avatar/${crypto.randomUUID()}.${extension}`
    const httpMetadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    }
    await env.BUCKET.put(key, file.stream(), { httpMetadata })

    if (ownStore.avatarKey) await env.BUCKET.delete(ownStore.avatarKey)
    await getDb().update(store).set({ avatarKey: key }).where(eq(store.id, storeId))

    return Result.succeed({ key })
  })

export const uploadStoreCover = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: FormData) => d)
  .handler(async ({ data }): Promise<Result.Result<{ key: string }, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const form = data as unknown as FormData
    const file = form.get('file')
    const storeId = form.get('storeId')
    if (!(file instanceof File) || file.size === 0)
      return Result.fail(new NotAllowedError({ message: 'Изберете слика.' }))
    const extension = EXTENSIONS[file.type]
    if (!extension)
      return Result.fail(
        new NotAllowedError({ message: 'Дозволени се само JPEG, PNG и WebP слики.' }),
      )
    if (file.size > MAX_UPLOAD_BYTES)
      return Result.fail(new NotAllowedError({ message: 'Сликата е преголема (најмногу 8 МБ).' }))
    if (typeof storeId !== 'string' || !storeId)
      return Result.fail(new NotAllowedError({ message: 'Недостасува продавница.' }))

    const ownStore =
      viewer.role === 'admin'
        ? await runEffect(selectAdminStore(storeId))
        : await runEffect(selectOwnerStoreById(storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа продавница.' }))

    const key = `stores/${storeId}/cover/${crypto.randomUUID()}.${extension}`
    const httpMetadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    }
    await env.BUCKET.put(key, file.stream(), { httpMetadata })

    if (ownStore.coverKey) await env.BUCKET.delete(ownStore.coverKey)
    await getDb().update(store).set({ coverKey: key }).where(eq(store.id, storeId))

    return Result.succeed({ key })
  })

export const deleteProductImage = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: { imageId: string }) => d)
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const db = getDb()
    const rows = await db
      .select({ id: productImage.id, r2Key: productImage.r2Key, productId: productImage.productId })
      .from(productImage)
      .where(eq(productImage.id, data.imageId))
      .limit(1)
    const image = rows[0]
    if (!image) return Result.fail(new NotFoundError({ message: 'Сликата не е најдена.' }))
    const canManage =
      viewer.role === 'admin'
        ? await runEffect(selectAdminProductRow(image.productId))
        : await runEffect(selectOwnedProductRow(image.productId, viewer.id))
    if (!canManage)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за овој производ.' }))
    await env.BUCKET.delete(image.r2Key)
    await db.delete(productImage).where(eq(productImage.id, data.imageId))
    return Result.succeed(null)
  })

export const reorderProductImages = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: { productId: string; imageIds: string[] }) => d)
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const owned =
      viewer.role === 'admin'
        ? await runEffect(selectAdminProductRow(data.productId))
        : await runEffect(selectOwnedProductRow(data.productId, viewer.id))
    if (!owned)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за овој производ.' }))
    const db = getDb()
    const rows = await db
      .select({ id: productImage.id })
      .from(productImage)
      .where(eq(productImage.productId, data.productId))
    const known = new Set(rows.map((r) => r.id))
    if (data.imageIds.some((id) => !known.has(id))) {
      return Result.fail(new NotAllowedError({ message: 'Некоја слика не припаѓа на производот.' }))
    }
    const statements = data.imageIds.map((id, position) =>
      db.update(productImage).set({ position }).where(eq(productImage.id, id)),
    )
    const [first, ...rest] = statements
    if (first) await db.batch([first, ...rest])
    return Result.succeed(null)
  })

export const deleteStoreAvatar = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: { storeId: string }) => d)
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const ownStore =
      viewer.role === 'admin'
        ? await runEffect(selectAdminStore(data.storeId))
        : await runEffect(selectOwnerStoreById(data.storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа продавница.' }))
    if (ownStore.avatarKey) await env.BUCKET.delete(ownStore.avatarKey)
    await getDb().update(store).set({ avatarKey: null }).where(eq(store.id, data.storeId))
    return Result.succeed(null)
  })

export const deleteStoreCover = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .validator((d: { storeId: string }) => d)
  .handler(async ({ data }): Promise<Result.Result<null, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const ownStore =
      viewer.role === 'admin'
        ? await runEffect(selectAdminStore(data.storeId))
        : await runEffect(selectOwnerStoreById(data.storeId, viewer.id))
    if (!ownStore)
      return Result.fail(new NotAllowedError({ message: 'Немате дозвола за оваа продавница.' }))
    if (ownStore.coverKey) await env.BUCKET.delete(ownStore.coverKey)
    await getDb().update(store).set({ coverKey: null }).where(eq(store.id, data.storeId))
    return Result.succeed(null)
  })

export const deleteUserAvatar = createServerFn({ method: 'POST', strict: { output: false } })
  .middleware([withViewer])
  .handler(async (): Promise<Result.Result<null, DomainError>> => {
    const viewer = await getViewer()
    if (!viewer) return Result.fail(new NotSignedInError({ message: 'Не сте најавени.' }))
    const db = getDb()
    const rows = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, viewer.id))
      .limit(1)
    const oldKey = r2KeyOf(rows[0]?.image)
    if (oldKey) await env.BUCKET.delete(oldKey)
    await db.update(user).set({ image: null }).where(eq(user.id, viewer.id))
    return Result.succeed(null)
  })
