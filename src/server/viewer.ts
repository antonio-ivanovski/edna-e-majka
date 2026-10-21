import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from './auth'

export type Viewer = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

/**
 * The signed-in person, read from the session cookie of the request being
 * handled. Server functions and loaders use this instead of trusting anything
 * the browser sends about who it is.
 */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })

  if (!session) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email,
    role: session.user.role === 'admin' ? 'admin' : 'user',
  }
}
