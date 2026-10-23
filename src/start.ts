import { createStart, createMiddleware } from '@tanstack/react-start'

/**
 * Security headers on every response. CSP keeps `unsafe-inline` for scripts and
 * styles because the hydrated app and sonner's injected styles need it; the
 * framing and content-type protections are the parts that actually bite.
 *
 * The Workers bindings are handed over here, on the first request. The import
 * is dynamic on purpose: this file is part of the client graph, and the
 * module behind it may only ever be loaded by the server.
 */
const securityHeaders = createMiddleware().server(async ({ next }) => {
  await import('./server/worker-env-boot')

  const result = await next()

  const headers = result.response.headers

  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
  )

  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}))
