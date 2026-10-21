import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'

import { NOT_SIGNED_IN, type ActionResult } from '#/lib/action'
import { getDb } from '#/server/db/client'
import { productImage, store } from '#/server/db/schema'
import { selectAdminProductRow, selectAdminStore } from '#/server/queries/admin'
import {
  selectNextImagePosition,
  selectOwnedProductRow,
  selectOwnerStoreById,
} from '#/server/queries/manage'
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

        if (typeof productId === 'string' && productId) {
          const owned =
            viewer.role === 'admin'
              ? await selectAdminProductRow(productId)
              : await selectOwnedProductRow(productId, viewer.id)

          if (!owned) {
            return json({ ok: false, message: 'Немате дозвола за овој производ.' }, 403)
          }

          const id = crypto.randomUUID()
          const key = `stores/${owned.storeId}/products/${productId}/${id}.${extension}`

          await env.BUCKET.put(key, file.stream(), { httpMetadata })

          const image = {
            id,
            key,
            alt: owned.title,
            width: dimension(form.get('width'), 1200),
            height: dimension(form.get('height'), 900),
            position: await selectNextImagePosition(productId),
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
              ? await selectAdminStore(storeId)
              : await selectOwnerStoreById(storeId, viewer.id)

          if (!ownStore) {
            return json({ ok: false, message: 'Немате дозвола за оваа продавница.' }, 403)
          }

          const key = `stores/${storeId}/avatar/${crypto.randomUUID()}.${extension}`

          await env.BUCKET.put(key, file.stream(), { httpMetadata })

          // The old avatar is replaced, not kept: nothing points at it again.
          if (ownStore.avatarKey) {
            await env.BUCKET.delete(ownStore.avatarKey)
          }

          await getDb().update(store).set({ avatarKey: key }).where(eq(store.id, storeId))

          return json({ ok: true, data: { key } })
        }

        return json({ ok: false, message: 'Недостасува производ или продавница.' }, 400)
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
              ? await selectAdminProductRow(image.productId)
              : await selectOwnedProductRow(image.productId, viewer.id)

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
              ? await selectAdminStore(storeId)
              : await selectOwnerStoreById(storeId, viewer.id)

          if (!ownStore) {
            return json({ ok: false, message: 'Немате дозвола за оваа продавница.' }, 403)
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
