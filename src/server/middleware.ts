import { notFound, redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { Effect } from 'effect'

import { runEffect } from './runtime'
import { Session } from './services/session'

export const withViewer = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const viewer = await runEffect(Effect.gen(function* () {
    const session = yield* Session
    return yield* session.getViewer()
  }))
  return next({ context: { viewer } })
})

export const withAdmin = createMiddleware({ type: 'function' })
  .middleware([withViewer])
  .server(async ({ next, context }) => {
    const viewer = context.viewer
    if (!viewer) throw redirect({ to: '/sign-in' })
    if (viewer.role !== 'admin') throw notFound()
    return next({ context: { admin: viewer } })
  })
