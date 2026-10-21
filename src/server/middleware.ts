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
