import { createFileRoute } from '@tanstack/react-router'

import { auth } from '#/server/auth'

/** Better Auth's own endpoints: magic-link sign-in and verification, Google OAuth. */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
