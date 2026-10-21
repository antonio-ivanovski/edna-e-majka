import { notFound, redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'

import { getViewer } from './viewer'

/**
 * Every server function that touches a shop or a session declares that it needs
 * the signed-in person, so the check lives in one place and cannot be forgotten
 * inside a handler.
 *
 * The viewer is `null` for callers with no session: mutations answer with a
 * message the form can show, while loader reads send the visitor to sign in.
 * The route guards are there for the UI; this is the data boundary.
 */
export const withViewer = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const viewer = await getViewer()

  return next({ context: { viewer } })
})

/**
 * Admin-only server functions.
 *
 * A signed-out caller is sent to sign in; anyone else gets the same 404 a
 * missing URL gives, so the dashboard does not advertise itself to the people
 * it is not for. The admin role is read from the database row behind the
 * session, never from anything the browser sends.
 */
export const withAdmin = createMiddleware({ type: 'function' })
  .middleware([withViewer])
  .server(async ({ next, context }) => {
    const viewer = context.viewer

    if (!viewer) {
      throw redirect({ to: '/sign-in' })
    }

    if (viewer.role !== 'admin') {
      throw notFound()
    }

    return next({ context: { admin: viewer } })
  })
