import { queryOptions } from '@tanstack/react-query'

import { listProducts, getProduct, getRelatedProducts } from '#/server/functions/products'
import type { ProductListFilters } from '#/api/schemas'

import { productKeys } from './keys'
export { productKeys }

export const productQueries = {
  list: (filters: ProductListFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: () =>
        listProducts({
          data: {
            ...filters,
            page: String(filters.page),
            minPrice: filters.minPrice != null ? String(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : undefined,
          },
        }),
      staleTime: 60 * 1000,
    }),
  detail: (productId: string) =>
    queryOptions({
      queryKey: productKeys.detail(productId),
      queryFn: () => getProduct({ data: { productId } }),
      staleTime: 60 * 1000,
    }),
  related: (productId: string) =>
    queryOptions({
      queryKey: productKeys.related(productId),
      queryFn: () => getRelatedProducts({ data: { productId } }),
      staleTime: 60 * 1000,
    }),
}
