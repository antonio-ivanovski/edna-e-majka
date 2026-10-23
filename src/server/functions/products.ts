import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { toValidator, ProductId, ProductListFilters } from '#/api/schemas'
import { runEffect } from '../runtime'
import { workerEnv } from '../worker-env'
import {
  selectProductDetail,
  selectProductPage,
  selectProductsByCategories,
  selectProductsByStore,
  selectFeaturedProducts,
} from '../queries/products'

export const listProducts = createServerFn({ method: 'GET' })
  .validator(toValidator(ProductListFilters))
  .handler(async ({ data }) => runEffect(selectProductPage(data)))

export const getProduct = createServerFn({ method: 'GET' })
  .validator(toValidator(ProductId))
  .handler(async ({ data }) => {
    const detail = await runEffect(selectProductDetail(data.productId))
    if (!detail) throw notFound()
    return detail
  })

export const getRelatedProducts = createServerFn({ method: 'GET' })
  .validator(toValidator(ProductId))
  .handler(async ({ data }) => {
    const detail = await runEffect(selectProductDetail(data.productId))
    if (!detail) throw notFound()
    // The address carries the slug, but exclusion is keyed by id: the raw
    // param may be a slug, so always exclude the resolved row id.
    const [fromStore, similarRaw] = await Promise.all([
      runEffect(selectProductsByStore(detail.store.id, detail.id)),
      runEffect(selectProductsByCategories(detail.categorySlugs, detail.id)),
    ])
    // A store-mate can also share a category: keep it in the store shelf
    // only, so the two sections never show the same card twice.
    const seen = new Set(fromStore.map((item) => item.id))
    const similar = similarRaw.filter((item) => !seen.has(item.id))
    return { fromStore, similar }
  })

/**
 * Absolute site origin for canonical/OG URLs. Read from `APP_URL` on the
 * server (same source as sitemap/robots); the production fallback is
 * `https://ednaemajka.mk`. Exposed as a server function so route loaders can
 * hand the base to `head`, which has no request in hand.
 */
export const getSiteBase = createServerFn({ method: 'GET' }).handler(() => {
  const configured = workerEnv().APP_URL?.trim()
  return configured ? configured.replace(/\/$/, '') : 'https://ednaemajka.mk'
})

export const getFeaturedProducts = createServerFn({ method: 'GET' }).handler(async () =>
  runEffect(selectFeaturedProducts(8)),
)
