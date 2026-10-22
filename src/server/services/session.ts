import { Context, Effect, Layer } from 'effect'

import { auth } from '../auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { NotSignedInError } from '../errors'

export interface Viewer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: 'user' | 'admin'
  readonly banned: boolean
}

export interface SessionService {
  readonly getViewer: () => Effect.Effect<Viewer | null, never>
  readonly requireViewer: () => Effect.Effect<Viewer, NotSignedInError>
}

export class Session extends Context.Service<Session, SessionService>()(
  'edna-e-majka/server/Session',
) {
  static readonly layer = Layer.sync(Session, () => {
    const getViewer = (): Effect.Effect<Viewer | null, never> =>
      Effect.tryPromise({
        try: async () => {
          const session = await auth.api.getSession({ headers: getRequestHeaders() })
          if (!session) return null
          const role = (session.user as { role?: string }).role === 'admin' ? 'admin' : 'user'
          const banned = Boolean((session.user as { banned?: boolean }).banned)
          if (banned) return null
          return {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role,
            banned,
          } satisfies Viewer
        },
        catch: () => null as never,
      }).pipe(Effect.orElseSucceed(() => null))

    const requireViewer = (): Effect.Effect<Viewer, NotSignedInError> =>
      Effect.gen(function* () {
        const viewer = yield* getViewer()
        if (!viewer) {
          return yield* new NotSignedInError({ message: 'Најавете се за да продолжите.' })
        }
        return viewer
      })

    return Session.of({ getViewer, requireViewer })
  })
}
