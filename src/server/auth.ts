import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { magicLink } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'
import { Schema } from 'effect'
import * as authSchema from './db/auth-schema'
import { getDb } from './db/client'
import { sendMagicLinkEmail } from './email'
import { Effect } from 'effect'
import { runEffect } from './runtime'
import { RateLimiter } from './services/rate-limit'

/** Short-lived and single use: the link is the credential. */
const MAGIC_LINK_TTL_SECONDS = 15 * 60

/** Per recipient address, independent of the caller's IP address. */
const MAGIC_LINK_EMAIL_QUOTA = { windowSeconds: 15 * 60, max: 3 }

const THIRTY_DAYS = 60 * 60 * 24 * 30

/** Better Auth validates the body itself; this only reads the address. */
const magicLinkRequestBody = Schema.Struct({ email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/))) })

/**
 * Google sign-in is offered only when credentials are configured; the button is
 * hidden otherwise. Nothing else in the app branches on configuration.
 */
function googleProvider() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return {}
  }

  return {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  }
}

export const auth = betterAuth({
  appName: 'Една е Мајка',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), {
    provider: 'sqlite',
    schema: authSchema,
  }),
  trustedOrigins: [env.BETTER_AUTH_URL, env.APP_URL],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  session: {
    expiresIn: THIRTY_DAYS,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 30,
    customRules: {
      '/sign-in/magic-link': { window: 60 * 60, max: 10 },
      '/magic-link/verify': { window: 15 * 60, max: 10 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
  },
  databaseHooks: {
    user: {
      create: {
        /**
         * The bootstrap admin is whoever signs in with `ADMIN_EMAIL`. There is
         * no separate seeding step and no password to hand out.
         */
        before: async (user) => {
          if (!env.ADMIN_EMAIL || user.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
            return
          }

          return { data: { ...user, role: 'admin' } }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/magic-link') {
        return
      }

      const decoded = Schema.decodeUnknownOption(magicLinkRequestBody)(ctx.body)
      if (decoded._tag === 'None') {
        return
      }

      const body = decoded.value

      const verdict = await runEffect(
        Effect.gen(function* () {
          const rl = yield* RateLimiter
          return yield* rl.consume({
            key: `magic-link:${body.email.toLowerCase()}`,
            ...MAGIC_LINK_EMAIL_QUOTA,
          })
        }),
      )

      if (!verdict.allowed) {
        throw new APIError('TOO_MANY_REQUESTS', {
          message: 'Побарани се премногу линкови за оваа адреса. Обиди се повторно подоцна.',
          headers: { 'X-Retry-After': String(verdict.retryAfterSeconds) },
        })
      }
    }),
  },
  socialProviders: googleProvider(),
  plugins: [
    magicLink({
      expiresIn: MAGIC_LINK_TTL_SECONDS,
      storeToken: 'hashed',
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({
          to: email,
          url,
          expiresInMinutes: MAGIC_LINK_TTL_SECONDS / 60,
        })
      },
    }),
    // Must stay last so session cookies set by earlier plugins are forwarded.
    tanstackStartCookies(),
  ],
})
