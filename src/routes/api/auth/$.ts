import { createFileRoute } from '@tanstack/react-router'

import { getAuth } from '#/server/auth'

/** Better Auth's own endpoints: magic-link sign-in and verification, Google OAuth. */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => getAuth().handler(request),
      POST: ({ request }) => getAuth().handler(request),
    },
  },
})
