import { createServerFn } from '@tanstack/react-start'
import { and, eq, or, sql } from 'drizzle-orm'

import { Schema } from 'effect'
import { TrimmedString } from '#/api/schemas/common'

import { buildSearchVariants } from '#/lib/translit'
import { getDb } from '../db/client'
import { product, store } from '../db/schema'

export type SearchSuggestion = {
  products: { id: string; title: string; slug: string | null }[]
  stores: { id: string; name: string; slug: string | null }[]
}

export const searchSuggestions = createServerFn({ method: 'GET' })
  .validator(Schema.toStandardSchemaV1(Schema.Struct({ query: TrimmedString(1, 64) })))
  .handler(async ({ data }): Promise<SearchSuggestion> => {
    const db = getDb()
    const variants = buildSearchVariants(data.query)

    const productConditions = variants.map(
      (variant) => sql`instr(${product.searchText}, ${variant}) > 0`,
    )
    const storeConditions = variants.map(
      (variant) => sql`instr(lower(${store.name}), ${variant.toLowerCase()}) > 0`,
    )

    const [productRows, storeRows] = await Promise.all([
      db
        .select({ id: product.id, title: product.title, slug: product.slug })
        .from(product)
        .innerJoin(store, eq(store.id, product.storeId))
        .where(
          and(
            eq(product.status, 'published'),
            eq(store.status, 'active'),
            or(...productConditions),
          ),
        )
        .orderBy(sql`${product.createdAt} desc`)
        .limit(6),
      db
        .select({ id: store.id, name: store.name, slug: store.slug })
        .from(store)
        .where(and(eq(store.status, 'active'), or(...storeConditions)))
        .limit(4),
    ])

    return { products: productRows, stores: storeRows }
  })
