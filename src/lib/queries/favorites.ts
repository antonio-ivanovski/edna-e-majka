import { queryOptions } from '@tanstack/react-query'

import { listFavoriteProducts, listFollowedStores } from '#/server/functions/favorites'

import { favoriteKeys } from './keys'
export { favoriteKeys }

export const favoriteQueries = {
  products: () =>
    queryOptions({
      queryKey: favoriteKeys.products(),
      queryFn: () => listFavoriteProducts(),
      staleTime: 60 * 1000,
    }),
  stores: () =>
    queryOptions({
      queryKey: favoriteKeys.stores(),
      queryFn: () => listFollowedStores(),
      staleTime: 60 * 1000,
    }),
}
