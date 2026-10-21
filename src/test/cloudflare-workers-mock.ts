/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal mock of the Cloudflare Workers `env` binding for unit tests.
export const env = {
  DB: null,
  BUCKET: {
    get: async () => null,
    put: async () => ({}),
    delete: async () => {},
  },
  APP_URL: 'https://example.com',
  R2_PUBLIC_BASE_URL: '',
  MAILER: { send: async () => ({}) },
  RATE_LIMITER: { limit: async () => ({ success: true }) },
} as any
