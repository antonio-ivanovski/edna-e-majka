import { Context, Layer } from 'effect'

import { env } from 'cloudflare:workers'

/**
 * Typed access to Cloudflare Worker bindings and vars. Centralising them here
 * means the rest of the code never imports `cloudflare:workers` directly and
 * the layer can be swapped out in tests.
 */
export interface AppEnv {
  readonly DB: typeof env.DB
  readonly BUCKET: typeof env.BUCKET
  readonly EMAIL: typeof env.EMAIL
  readonly APP_URL: string
  readonly R2_PUBLIC_BASE_URL: string
  readonly EMAIL_FROM: string
  readonly EMAIL_FROM_NAME: string
  readonly BETTER_AUTH_URL: string
  readonly BETTER_AUTH_SECRET: string
  readonly ADMIN_EMAIL: string | undefined
  readonly GOOGLE_CLIENT_ID: string | undefined
  readonly GOOGLE_CLIENT_SECRET: string | undefined
}

export class Env extends Context.Service<Env, AppEnv>()('edna-e-majka/server/Env') {
  static readonly layer = Layer.sync(Env, () =>
    Env.of({
      DB: env.DB,
      BUCKET: env.BUCKET,
      EMAIL: env.EMAIL,
      APP_URL: env.APP_URL,
      R2_PUBLIC_BASE_URL: env.R2_PUBLIC_BASE_URL,
      EMAIL_FROM: env.EMAIL_FROM,
      EMAIL_FROM_NAME: env.EMAIL_FROM_NAME,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      ADMIN_EMAIL: env.ADMIN_EMAIL,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    }),
  )
}
