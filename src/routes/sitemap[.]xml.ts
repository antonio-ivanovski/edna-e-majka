import { and, eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'

import { env } from 'cloudflare:workers'

import { runEffect } from '#/server/runtime'
import { Db } from '#/server/services/db'
import { product, store } from '#/server/db/schema'

function baseUrl(): string {
  const configured = env.APP_URL?.trim()
  return configured ? configured.replace(/\/$/, '') : 'https://ednaemajka.antonio.mk'
}

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
        const { stores, products } = await runEffect(
          Effect.gen(function* () {
            const db = yield* Db
            const stores = yield* db.run((d) =>
              d.select({ id: store.id, slug: store.slug, updatedAt: store.updatedAt }).from(store).where(eq(store.status, 'active')),
            )
            const products = yield* db.run((d) =>
              d
                .select({ id: product.id, slug: product.slug, updatedAt: product.updatedAt })
                .from(product)
                .innerJoin(store, eq(store.id, product.storeId))
                .where(and(eq(product.status, 'published'), eq(store.status, 'active'))),
            )
            return { stores, products }
          }),
        )

        const base = baseUrl()
        const now = new Date().toISOString()

        const urls = [
          { loc: `${base}/`, lastmod: now },
          { loc: `${base}/producers`, lastmod: now },
          ...stores.map((item) => ({ loc: `${base}/producers/${item.slug ?? item.id}`, lastmod: item.updatedAt.toISOString() })),
          ...products.map((item) => ({ loc: `${base}/products/${item.slug ?? item.id}`, lastmod: item.updatedAt.toISOString() })),
        ]

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => `  <url>\n    <loc>${escape(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
  .join('\n')}
</urlset>
`

        return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
      },
    },
  },
})
