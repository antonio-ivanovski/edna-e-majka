import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

import { runEffect } from '../runtime'
import { Session } from '../services/session'
import type { Viewer } from '../services/session'

/** Who is signed in, if anyone. Used by the header and by route guards. */
export const fetchViewer = createServerFn({ method: 'GET' }).handler(async () =>
  runEffect(Effect.gen(function* () {
    const session = yield* Session
    return yield* session.getViewer()
  })),
)

export async function requireViewer(): Promise<Viewer> {
  const viewer = await fetchViewer()

  if (!viewer) {
    throw redirect({ to: '/sign-in' })
  }

  return viewer
}
