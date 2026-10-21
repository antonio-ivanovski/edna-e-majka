import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'

import { NOT_SIGNED_IN, type ActionResult } from '#/lib/action'
import { getDb } from '#/server/db/client'
import { user } from '#/server/db/auth-schema'
import { productImage, store } from '#/server/db/schema'
import { selectAdminProductRow, selectAdminStore } from '#/server/queries/admin'
import {
  selectNextImagePosition,
  selectOwnedProductRow,
  selectOwnerStoreById,
} from '#/server/queries/manage'
import { runEffect } from '#/server/runtime'
import { getViewer } from '#/server/viewer'

/**
 * Uploads for product photos and the shop avatar.
 *
 * The browser has already shrunk the file and re-encoded it, but nothing sent
 * by a browser is trusted: the type and size are checked here, the product or
 * shop is confirmed to belong to the caller — or the caller is an admin editing
 * someone else's shop — and only the key is stored. Keys never change, so
 * `/images/$key` can serve them immutably for a year.
 */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** The bucket key behind an `/images/{key}` address, when it is one of ours. */
function r2KeyOf(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/images/')) {
    return null
  }

  return url.slice('/images/'.length)
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_EDGE = 20_000

function json(body: ActionResult<unknown>, status = 200) {
  return Response.json(body, { status })
}

/** Only used as a layout hint, so anything odd becomes the default. */
function dimension(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_EDGE ? parsed : fallback
}

export const Route = createFileRoute('/api/uploads')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const viewer = await getViewer()

        if (!viewer) {
          return json(NOT_SIGNED_IN, 401)
        }

        const form = await request.formData().catch(() => null)

        if (!form) {
          return json({ ok: false, message: 'Не успеавме да ја прочитаме сликата.' }, 400)
        }

        const file = form.get('file')
        const productId = form.get('productId')
        const storeId = form.get('storeId')

        if (!(file instanceof File) || file.size === 0) {
          return json({ ok: false, message: 'Изберете слика.' }, 400)
        }

        const extension = EXTENSIONS[file.type]

        if (!extension) {
          return json({ ok: false, message: 'Дозволени се само JPEG, PNG и WebP слики.' }, 400)
        }

        if (file.size > MAX_UPLOAD_BYTES) {
          return json({ ok: false, message: 'Сликата е преголема (најмногу 8 МБ).' }, 400)
        }

        const httpMetadata = {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000, immutable',
        }

        if (form.get('userAvatar') === '1') {
          const key = `users/${viewer.id}/avatar/${crypto.randomUUID()}.${extension}`

          await env.BUCKET.put(key, file.stream(), { httpMetadata })

          const rows = await getDb()
            .select({ image: user.image })
            .from(user)
            .where(eq(user.id, viewer.id))
            .limit(1)

          const oldKey = r2KeyOf(rows[0]?.image)

          if (oldKey) {
            await env.BUCKET.delete(oldKey)
          }

          await getDb()
            .update(user)
            .set({ image: `/images/${key}` })
            .where(eq(user.id, viewer.id))

          return json({ ok: true, data: { key } })
        }

        if (typeof productId === 'string' && productId) {
          const owned =
            viewer.role === 'admin'
              ? await runEffect(selectAdminProductRow(productId))
              : await runEffect(selectOwnedProductRow(productId, viewer.id))

          if (!owned) {
            return json({ ok: false, message: 'Немате дозвола за овој производ.' }, 403)
          }

          const id = crypto.randomUUID()
          const key = `stores/${owned.storeId}/products/${productId}/${id}.${extension}`

          await env.BUCKET.put(key, file.stream(), { httpMetadata })

          const altRaw = form.get('alt')
          const alt =
            typeof altRaw === 'string' && altRaw.trim() ? altRaw.trim().slice(0, 200) : null

          const image = {
            id,
            key,
            alt,
            width: dimension(form.get('width'), 1200),
            height: dimension(form.get('height'), 900),
            position: await runEffect(selectNextImagePosition(productId)),
          }

          await getDb().insert(productImage).values({
            id: image.id,
            productId,
            r2Key: image.key,
            width: image.width,
            height: image.height,
            alt: image.alt,
            position: image.position,
          })

          return json({ ok: true, data: image })
        }

        if (typeof storeId === 'string' && storeId) {
          const ownStore =
            viewer.role === 'admin'
              ? await runEffect(selectAdminStore(storeId))
              : await runEffect(selectOwnerStoreById(storeId, viewer.id))

          if (!ownStore) {
            return json({ ok: false, message: 'Немате дозвола за оваа продавница.' }, 403)
          }

          // The cover is a banner behind the shop; the avatar is the round one.
          const isCover = form.get('cover') === '1'

          const key = isCover
            ? `stores/${storeId}/cover/${crypto.randomUUID()}.${extension}`
            : `stores/${storeId}/avatar/${crypto.randomUUID()}.${extension}`

          await env.BUCKET.put(key, file.stream(), { httpMetadata })

          // The old image is replaced, not kept: nothing points at it again.
          if (isCover) {
            if (ownStore.coverKey) {
              await env.BUCKET.delete(ownStore.coverKey)
            }

            await getDb().update(store).set({ coverKey: key }).where(eq(store.id, storeId))
          } else {
            if (ownStore.avatarKey) {
              await env.BUCKET.delete(ownStore.avatarKey)
            }

            await getDb().update(store).set({ avatarKey: key }).where(eq(store.id, storeId))
          }

          return json({ ok: true, data: { key } })
        }

        return json({ ok: false, message: 'Недостасува производ или продавница.' }, 400)
      },

      PATCH: async ({ request }) => {
        const viewer = await getViewer()

        if (!viewer) {
          return json(NOT_SIGNED_IN, 401)
        }

        const body = (await request.json().catch(() => null)) as {
          productId?: unknown
          imageIds?: unknown
        } | null

        const productId = typeof body?.productId === 'string' ? body.productId : ''
        const imageIds = Array.isArray(body?.imageIds)
          ? body.imageIds.filter((id): id is string => typeof id === 'string')
          : []

        if (!productId || imageIds.length === 0) {
          return json({ ok: false, message: 'Нема слики за преместување.' }, 400)
        }

        const owned =
          viewer.role === 'admin'
            ? await runEffect(selectAdminProductRow(productId))
            : await runEffect(selectOwnedProductRow(productId, viewer.id))

        if (!owned) {
          return json({ ok: false, message: 'Немате дозвола за овој производ.' }, 403)
        }

        const db = getDb()
        const rows = await db
          .select({ id: productImage.id })
          .from(productImage)
          .where(eq(productImage.productId, productId))

        const known = new Set(rows.map((row) => row.id))

        // Only images of this product may be reordered: the ids come from the
        // browser and nothing else is trusted.
        if (imageIds.some((id) => !known.has(id))) {
          return json({ ok: false, message: 'Некоја слика не припаѓа на производот.' }, 400)
        }

        const statements = imageIds.map((id, position) =>
          db.update(productImage).set({ position }).where(eq(productImage.id, id)),
        )

        const [first, ...rest] = statements

        if (first) {
          await db.batch([first, ...rest])
        }

        return json({ ok: true, data: null })
      },

      DELETE: async ({ request }) => {
        const viewer = await getViewer()

        if (!viewer) {
          return json(NOT_SIGNED_IN, 401)
        }

        const url = new URL(request.url)
        const imageId = url.searchParams.get('imageId')
        const storeId = url.searchParams.get('storeId')
        const db = getDb()

        if (url.searchParams.get('userAvatar') === '1') {
          const rows = await db
            .select({ image: user.image })
            .from(user)
            .where(eq(user.id, viewer.id))
            .limit(1)

          const oldKey = r2KeyOf(rows[0]?.image)

          if (oldKey) {
            await env.BUCKET.delete(oldKey)
          }

          await db.update(user).set({ image: null }).where(eq(user.id, viewer.id))

          return json({ ok: true, data: null })
        }

        if (imageId) {
          const rows = await db
            .select({
              id: productImage.id,
              r2Key: productImage.r2Key,
              productId: productImage.productId,
            })
            .from(productImage)
            .where(eq(productImage.id, imageId))
            .limit(1)

          const image = rows[0]

          if (!image) {
            return json({ ok: false, message: 'Сликата не е најдена.' }, 404)
          }

          const canManage =
            viewer.role === 'admin'
              ? await runEffect(selectAdminProductRow(image.productId))
              : await runEffect(selectOwnedProductRow(image.productId, viewer.id))

          if (!canManage) {
            return json({ ok: false, message: 'Немате дозвола за овој производ.' }, 403)
          }

          await env.BUCKET.delete(image.r2Key)
          await db.delete(productImage).where(eq(productImage.id, imageId))

          return json({ ok: true, data: null })
        }

        if (storeId) {
          const ownStore =
            viewer.role === 'admin'
              ? await runEffect(selectAdminStore(storeId))
              : await runEffect(selectOwnerStoreById(storeId, viewer.id))

          if (!ownStore) {
            return json({ ok: false, message: 'Немате дозвола за оваа продавница.' }, 403)
          }

          if (url.searchParams.get('cover') === '1') {
            if (ownStore.coverKey) {
              await env.BUCKET.delete(ownStore.coverKey)
            }

            await db.update(store).set({ coverKey: null }).where(eq(store.id, storeId))

            return json({ ok: true, data: null })
          }

          if (ownStore.avatarKey) {
            await env.BUCKET.delete(ownStore.avatarKey)
          }

          await db.update(store).set({ avatarKey: null }).where(eq(store.id, storeId))

          return json({ ok: true, data: null })
        }

        return json({ ok: false, message: 'Недостасува слика.' }, 400)
      },
    },
  },
})
