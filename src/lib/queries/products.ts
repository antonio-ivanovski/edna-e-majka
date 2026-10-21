import { queryOptions } from '@tanstack/react-query'

import { listProducts, getProduct, getRelatedProducts } from '#/server/functions/products'
import type { ProductListFilters } from '#/api/schemas'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  related: (id: string) => [...productKeys.details(), id, 'related'] as const,
}

export const productQueries = {
  list: (filters: ProductListFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: () => listProducts({ data: { ...filters, page: String(filters.page) } }),
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
