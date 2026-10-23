import { inferAdditionalFields, magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { Auth } from '#/server/auth'

/**
 * The browser side of the session. The additional fields come from the server
 * instance so `session.user.role` is typed without redeclaring it here.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), inferAdditionalFields<Auth>()],
})
