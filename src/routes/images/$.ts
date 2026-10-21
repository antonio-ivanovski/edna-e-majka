import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

/**
 * Product and store images, read from R2 under opaque keys
 * (`stores/{storeId}/products/{productId}/{uuid}.jpg`).
 *
 * Keys never change once written — replacing a photo writes a new key — so the
 * response is immutable and can be cached at the edge for a year.
 */
const KEY_PATTERN = /^[A-Za-z0-9/_.-]{1,512}$/

export const Route = createFileRoute('/images/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = params._splat ?? ''

        // Reject anything that is not a plain key, so the bucket is not a
        // general read-through for arbitrary paths.
        if (!KEY_PATTERN.test(key) || key.includes('..')) {
          return new Response('Не е најдена слика.', { status: 404 })
        }

        const object = await env.BUCKET.get(key)

        if (!object) {
          return new Response('Не е најдена слика.', { status: 404 })
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        if (request.headers.get('if-none-match') === object.httpEtag) {
          return new Response(null, { status: 304, headers })
        }

        return new Response(object.body, { headers })
      },
    },
  },
})
