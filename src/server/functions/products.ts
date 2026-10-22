import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { toValidator, ProductId, ProductListFilters } from '#/api/schemas'
import { runEffect } from '../runtime'
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
    const [fromStore, similar] = await Promise.all([
      runEffect(selectProductsByStore(detail.store.id, data.productId)),
      runEffect(selectProductsByCategories(detail.categorySlugs, data.productId)),
    ])
    return { fromStore, similar }
  })

export const getFeaturedProducts = createServerFn({ method: 'GET' }).handler(async () =>
  runEffect(selectFeaturedProducts(8)),
)
