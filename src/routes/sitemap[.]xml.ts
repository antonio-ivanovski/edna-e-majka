import { and, eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

import { getDb } from '#/server/db/client'
import { product, store } from '#/server/db/schema'

/** The public address the sitemap is written for. */
function baseUrl(): string {
  const configured = env.APP_URL?.trim()

  return configured ? configured.replace(/\/$/, '') : 'https://ednaemajka.antonio.mk'
}

/** Escape the five characters that would break an XML text node. */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const db = getDb()

        const stores = await db
          .select({ id: store.id, updatedAt: store.updatedAt })
          .from(store)
          .where(eq(store.status, 'active'))

        const products = await db
          .select({ id: product.id, updatedAt: product.updatedAt })
          .from(product)
          .innerJoin(store, eq(store.id, product.storeId))
          .where(and(eq(product.status, 'published'), eq(store.status, 'active')))

        const base = baseUrl()
        const now = new Date().toISOString()

        const urls = [
          { loc: `${base}/`, lastmod: now },
          { loc: `${base}/producers`, lastmod: now },
          ...stores.map((item) => ({
            loc: `${base}/producers/${item.id}`,
            lastmod: item.updatedAt.toISOString(),
          })),
          ...products.map((item) => ({
            loc: `${base}/products/${item.id}`,
            lastmod: item.updatedAt.toISOString(),
          })),
        ]

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${escape(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`

        return new Response(body, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        })
      },
    },
  },
})
