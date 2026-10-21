import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { productIdSchema, productListFiltersSchema } from '#/lib/schemas'

import { selectProductDetail, selectProductPage } from '../queries/products'

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
