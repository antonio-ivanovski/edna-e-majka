import { createFileRoute } from '@tanstack/react-router'

import { workerEnv } from '#/server/worker-env'

function baseUrl(): string {
  const configured = workerEnv().APP_URL?.trim()

  return configured ? configured.replace(/\/$/, '') : 'https://ednaemajka.antonio.mk'
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl()}/sitemap.xml\n`

        return new Response(body, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      },
    },
  },
})
