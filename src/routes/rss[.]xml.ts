import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

import { listProducts } from '#/server/functions/products'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const page = await listProducts({ data: { page: 1 } })
        const base = env.APP_URL.replace(/\/$/, '')
        const items = page.items
          .map(
            (product) => `
    <item>
      <title>${escapeXml(product.title)}</title>
      <link>${base}/products/${product.id}</link>
      <description>${escapeXml(product.description)}</description>
      <pubDate>${new Date(product.createdAt).toUTCString()}</pubDate>
    </item>`,
          )
          .join('')

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ЕДНА Е МАЈКА</title>
    <link>${base}/</link>
    <description>Тука се сите домашни производи.</description>
    ${items}
  </channel>
</rss>`

        return new Response(xml, {
          headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
        })
      },
    },
  },
})

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
