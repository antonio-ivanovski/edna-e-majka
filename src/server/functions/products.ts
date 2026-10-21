import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { productIdSchema, productListFiltersSchema } from '#/lib/schemas'

import {
  selectProductDetail,
  selectProductPage,
  selectProductsByCategories,
  selectProductsByStore,
} from '../queries/products'

/** One page of the public catalogue: home, category, producer and search pages. */
export const listProducts = createServerFn({ method: 'GET' })
  .validator(productListFiltersSchema)
  .handler(async ({ data }) => selectProductPage(data))

export const getProduct = createServerFn({ method: 'GET' })
  .validator(productIdSchema)
  .handler(async ({ data }) => {
    const detail = await selectProductDetail(data.productId)

    if (!detail) {
      throw notFound()
    }

    return detail
  })

/**
 * Two short lists for the bottom of the product page: what else the same shop
 * sells, and what other shops sell in the same categories.
 */
export const getRelatedProducts = createServerFn({ method: 'GET' })
  .validator(productIdSchema)
  .handler(async ({ data }) => {
    const detail = await selectProductDetail(data.productId)

    if (!detail) {
      throw notFound()
    }

    const [fromStore, similar] = await Promise.all([
      selectProductsByStore(detail.store.id, data.productId),
      selectProductsByCategories(detail.categorySlugs, data.productId),
    ])

    return { fromStore, similar }
  })
