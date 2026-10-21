import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from './auth'

/**
 * Loads the current session for server functions. Route guards are UX only —
 * every server function that touches private data must carry one of these.
 */
export const sessionMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })

  return next({ context: { session } })
})

/** Rejects anonymous callers. */
export const requireUser = createMiddleware({ type: 'function' })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw new Error('Најавата е потребна за оваа акција.')
    }

    return next({ context: { user: context.session.user, session: context.session.session } })
  })

/** Rejects anyone whose account is not an admin. */
export const requireAdmin = createMiddleware({ type: 'function' })
  .middleware([requireUser])
  .server(async ({ next, context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Немаш дозвола за оваа акција.')
    }

    return next({ context })
  })
