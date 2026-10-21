/**
 * Writes the readable addresses for rows that were created before slugs
 * existed. New rows get their slug when they are created, so this only has to
 * run once, right after the migration that added the columns.
 *
 *   pnpm db:backfill-slugs
 */
import { eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { getPlatformProxy } from 'wrangler'

import { slugify, uniqueSlug } from '#/lib/slug'
import { product, store } from '#/server/db/schema'

async function main() {
  const platform = await getPlatformProxy<{ DB: D1Database }>({
    configPath: 'wrangler.jsonc',
    persist: true,
  })

  const db = drizzle(platform.env.DB)

  const storeRows = await db.select({ id: store.id, name: store.name }).from(store)
  const takenStores = new Set<string>()

  for (const row of storeRows) {
    const slug = uniqueSlug(slugify(row.name), (candidate) => takenStores.has(candidate))

    takenStores.add(slug)
    await db.update(store).set({ slug }).where(eq(store.id, row.id))
  }

  console.info(`Wrote ${storeRows.length} shop slugs.`)

  const productRows = await db.select({ id: product.id, title: product.title }).from(product)
  const takenProducts = new Set<string>()

  for (const row of productRows) {
    const slug = uniqueSlug(slugify(row.title), (candidate) => takenProducts.has(candidate))

    takenProducts.add(slug)
    await db.update(product).set({ slug }).where(eq(product.id, row.id))
  }

  console.info(`Wrote ${productRows.length} product slugs.`)

  const left = await db
    .select({ id: product.id })
    .from(product)
    .where(isNull(product.slug))
    .limit(1)

  if (left.length > 0) {
    console.error('Some rows still have no slug.')
    process.exitCode = 1
  }

  await platform.dispose()
}

await main()
