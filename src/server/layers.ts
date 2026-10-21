import { Layer } from 'effect'

import { Assets } from './services/assets'
import { Db } from './services/db'
import { Env } from './services/env'
import { Mailer } from './services/mailer'
import { RateLimiter } from './services/rate-limit'
import { Session } from './services/session'

/**
 * The single application layer. Every Effect program in the server declares its
 * requirements against the individual services; this layer provides them all.
 * `Assets`, `Mailer` and `RateLimiter` depend on `Env`/`Db`, so they are
 * provided after.
 */
export const AppLayer = Layer.mergeAll(
  Env.layer,
  Db.layer,
  Layer.provide(Assets.layer, Env.layer),
  Layer.provide(Mailer.layer, Env.layer),
  Layer.provide(RateLimiter.layer, Db.layer.pipe(Layer.provide(Env.layer))),
  Session.layer,
)
