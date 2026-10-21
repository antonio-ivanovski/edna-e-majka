import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'

import { runEffect } from '#/server/runtime'
import { Assets } from '#/server/services/assets'

const KEY_PATTERN = /^[A-Za-z0-9/_.-]{1,512}$/

export const Route = createFileRoute('/images/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = params._splat ?? ''

        if (!KEY_PATTERN.test(key) || key.includes('..')) {
          return new Response('Не е најдена слика.', { status: 404 })
        }

        const object = await runEffect(
          Effect.gen(function* () {
            const assets = yield* Assets
            return yield* assets.get(key)
          }),
        )

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
