import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getViewer, type Viewer } from '../viewer'

/** Who is signed in, if anyone. Used by the header and by route guards. */
export const fetchViewer = createServerFn({ method: 'GET' }).handler(async () => getViewer())

/**
 * The route guard behind `/manage`.
 *
 * A guard protects the page, not the data: every server function that reads or
 * writes a shop still checks the session itself, because its endpoint can be
 * called without loading any route at all.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await fetchViewer()

  if (!viewer) {
    throw redirect({ to: '/sign-in' })
  }

  return viewer
}
